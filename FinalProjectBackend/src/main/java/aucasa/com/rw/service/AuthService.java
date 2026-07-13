package aucasa.com.rw.service;

import aucasa.com.rw.domain.PasswordResetToken;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.DisciplineStatus;
import aucasa.com.rw.dto.auth.AccountSetupRequest;
import aucasa.com.rw.dto.auth.ForgotPasswordRequest;
import aucasa.com.rw.dto.auth.LoginRequest;
import aucasa.com.rw.dto.auth.LoginResponse;
import aucasa.com.rw.dto.auth.ResetPasswordRequest;
import aucasa.com.rw.dto.student.StudentRegistrationRequest;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.repository.PasswordResetTokenRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int RESET_TOKEN_BYTES = 32;
    private static final int RESET_TOKEN_EXPIRY_MINUTES = 60;

    private final UserAccountRepository userAccountRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentProfileService studentProfileService;
    private final ImsStudentGatewayService imsStudentGatewayService;
    private final PasswordPolicyService passwordPolicyService;
    private final LoginAttemptService loginAttemptService;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String frontendBaseUrl;
    private final String mailFrom;
    private final String smtpHost;
    private final String smtpUsername;
    private final String smtpPassword;

    public AuthService(
            UserAccountRepository userAccountRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            StudentProfileRepository studentProfileRepository,
            PasswordEncoder passwordEncoder,
            StudentProfileService studentProfileService,
            ImsStudentGatewayService imsStudentGatewayService,
            PasswordPolicyService passwordPolicyService,
            LoginAttemptService loginAttemptService,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl,
            @Value("${app.mail.from:no-reply@aucasa.local}") String mailFrom,
            @Value("${spring.mail.host:}") String smtpHost,
            @Value("${spring.mail.username:}") String smtpUsername,
            @Value("${spring.mail.password:}") String smtpPassword
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentProfileService = studentProfileService;
        this.imsStudentGatewayService = imsStudentGatewayService;
        this.passwordPolicyService = passwordPolicyService;
        this.loginAttemptService = loginAttemptService;
        this.mailSenderProvider = mailSenderProvider;
        this.frontendBaseUrl = stripTrailingSlash(frontendBaseUrl);
        this.mailFrom = mailFrom;
        this.smtpHost = smtpHost;
        this.smtpUsername = smtpUsername;
        this.smtpPassword = smtpPassword;
    }

    @Transactional
    public void setupAccount(AccountSetupRequest request) {
        if (request == null || isBlank(request.getStudentNumber()) || isBlank(request.getPassword())) {
            throw new IllegalArgumentException("studentNumber and password are required.");
        }

        String studentNumber = request.getStudentNumber().trim();
        String password = request.getPassword();
        passwordPolicyService.validate(password);
        StudentProfile student = studentProfileRepository
                .findByStudentNumber(studentNumber)
                .orElseGet(() -> importStudentFromIms(studentNumber));

        UserAccount user = student.getUserAccount();
        user.setPasswordHash(passwordEncoder.encode(password));
        userAccountRepository.save(user);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        if (request == null || isBlank(request.getUsernameOrEmail()) || isBlank(request.getPassword())) {
            throw new IllegalArgumentException("usernameOrEmail and password are required.");
        }

        String input = request.getUsernameOrEmail().trim();
        loginAttemptService.assertNotLocked(input);
        Optional<UserAccount> userOpt = userAccountRepository.findByEmail(input);
        if (userOpt.isEmpty()) {
            String normalized = normalizeUsername(input);
            userOpt = userAccountRepository.findByUsername(normalized);
        }

        UserAccount user = userOpt.orElse(null);
        if (user == null) {
            loginAttemptService.recordFailure(input);
            throw new IllegalArgumentException("Invalid credentials.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            loginAttemptService.recordFailure(input);
            throw new IllegalArgumentException("Invalid credentials.");
        }
        loginAttemptService.recordSuccess(input);

        Optional<StudentProfile> studentOpt = studentProfileRepository.findByUserAccountId(user.getId());
        if (studentOpt.isEmpty()) {
            if (user.getRole() != null && user.getRole().getName() == RoleType.STUDENT) {
                throw new IllegalArgumentException("Student account is inactive or removed.");
            }
            return new LoginResponse(
                    user.getId(),
                    null,
                    user.getUsername(),
                    user.getFirstName() + " " + user.getLastName(),
                    "",
                    "",
                    "",
                    "",
                    0,
                    user.getRole().getName().name().toLowerCase(),
                    "0.00",
                    0,
                    ""
            );
        }

        StudentProfile student = studentOpt.get();
        refreshStudentAcademicSnapshotFromIms(student);
        student = studentProfileRepository.findById(student.getId()).orElse(student);
        String faculty = student.getFaculty() != null ? student.getFaculty().getName() : "";
        String department = student.getDepartment() != null ? student.getDepartment().getName() : "";
        String program = student.getProgram() != null ? student.getProgram() : "Day";
        Integer credits = student.getCredits() != null ? student.getCredits() : 0;
        String gpa = student.getGpa() != null ? student.getGpa().toPlainString() : "0.00";
        Integer semester = student.getSemester() != null ? student.getSemester() : 0;
        String disciplineStatus = student.getDisciplineStatus() != null ? student.getDisciplineStatus().name() : "";

        return new LoginResponse(
                user.getId(),
                student.getId(),
                user.getUsername(),
                user.getFirstName() + " " + user.getLastName(),
                student.getStudentNumber(),
                faculty,
                department,
                program,
                credits,
                user.getRole().getName().name().toLowerCase(),
                gpa,
                semester,
                disciplineStatus
        );
    }

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        if (request == null || isBlank(request.getEmail())) {
            throw new IllegalArgumentException("Email is required.");
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Optional<UserAccount> userOpt = userAccountRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", email);
            return;
        }

        UserAccount user = userOpt.get();
        passwordResetTokenRepository.deleteByUserAccountAndUsedAtIsNull(user);

        String token = generateResetToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUserAccount(user);
        resetToken.setTokenHash(hashToken(token));
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES));
        passwordResetTokenRepository.save(resetToken);

        sendPasswordResetEmail(user, buildResetLink(token));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || isBlank(request.getToken()) || isBlank(request.getPassword())) {
            throw new IllegalArgumentException("Reset token and password are required.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashToken(request.getToken().trim()))
                .orElseThrow(() -> new IllegalArgumentException("This reset link is invalid or expired."));
        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This reset link is invalid or expired.");
        }

        passwordPolicyService.validate(request.getPassword());
        UserAccount user = resetToken.getUserAccount();
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userAccountRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
        loginAttemptService.recordSuccess(user.getEmail());
        loginAttemptService.recordSuccess(user.getUsername());
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String generateResetToken() {
        byte[] bytes = new byte[RESET_TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to process reset token.", ex);
        }
    }

    private String buildResetLink(String token) {
        return frontendBaseUrl + "?resetToken=" + token;
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:5173";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private void sendPasswordResetEmail(UserAccount user, String resetLink) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || isBlank(smtpHost) || isBlank(smtpUsername) || isBlank(smtpPassword)) {
            log.warn("SMTP is not configured. Password reset link for {}: {}", user.getEmail(), resetLink);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(user.getEmail());
        message.setSubject("AUCASA password reset");
        message.setText("""
                Hello %s,

                Use this link to reset your AUCASA Student Hub password:
                %s

                This link expires in %d minutes. If you did not request it, ignore this email.
                """.formatted(user.getFirstName(), resetLink, RESET_TOKEN_EXPIRY_MINUTES));
        try {
            mailSender.send(message);
            log.info("Password reset email sent to {} using SMTP account {}.", user.getEmail(), smtpUsername);
        } catch (MailException ex) {
            log.warn("Could not send password reset email to {}. Reset link: {}", user.getEmail(), resetLink, ex);
        }
    }

    private String normalizeUsername(String input) {
        return input.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private StudentProfile importStudentFromIms(String studentNumber) {
        if (!imsStudentGatewayService.isConfigured()) {
            throw new IllegalArgumentException(
                    "Student was not found locally, and IMS lookup is not configured. Set app.ims.api-key (x-ims-api-key) or app.ims.bearer-token in backend configuration."
            );
        }

        ImsStudentGatewayService.ImsStudentRecord imsStudent = imsStudentGatewayService.findStudentById(studentNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Student not found in IMS. Confirm the student ID and ensure IMS API key/token permissions are valid."
                ));

        if (!isBlank(imsStudent.status()) && !"ACTIVE".equalsIgnoreCase(imsStudent.status())) {
            throw new IllegalArgumentException("Student is not active in university records.");
        }

        StudentRegistrationRequest registrationRequest = new StudentRegistrationRequest();
        registrationRequest.setStudentNumber(studentNumber);

        String[] names = splitName(imsStudent.name());
        registrationRequest.setFirstName(names[0]);
        registrationRequest.setLastName(names[1]);
        registrationRequest.setFaculty(inferFaculty(imsStudent.departmentCode()));
        registrationRequest.setDepartment(isBlank(imsStudent.departmentCode()) ? "General" : imsStudent.departmentCode());
        registrationRequest.setProgram(isBlank(imsStudent.program()) ? "Day" : imsStudent.program());
        registrationRequest.setCredits(imsStudent.earnedCredits() != null ? imsStudent.earnedCredits() : 0);
        registrationRequest.setSemester(imsStudent.semester() != null ? imsStudent.semester() : 1);
        registrationRequest.setGpa(imsStudent.gpa() != null ? imsStudent.gpa().doubleValue() : 0.0);

        studentProfileService.registerStudent(registrationRequest);

        return studentProfileRepository
                .findByStudentNumber(studentNumber)
                .orElseThrow(() -> new IllegalArgumentException("Failed to import student from IMS."));
    }

    private String[] splitName(String fullName) {
        if (isBlank(fullName)) {
            return new String[] {"Student", "Unknown"};
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return new String[] {parts[0], "Student"};
        }
        String firstName = parts[0];
        StringBuilder lastName = new StringBuilder();
        for (int i = 1; i < parts.length; i++) {
            if (i > 1) {
                lastName.append(" ");
            }
            lastName.append(parts[i]);
        }
        return new String[] {firstName, lastName.toString()};
    }

    private String inferFaculty(String departmentName) {
        if (isBlank(departmentName)) {
            return "AUCA";
        }
        String normalized = departmentName.toLowerCase();
        if (normalized.contains("software") || normalized.contains("network") || normalized.contains("information")
                || normalized.contains("computer") || normalized.contains("it")) {
            return "Information Technology";
        }
        if (normalized.contains("business") || normalized.contains("account")) {
            return "Business Administration";
        }
        if (normalized.contains("law")) {
            return "Law";
        }
        if (normalized.contains("nursing") || normalized.contains("health")) {
            return "Health Sciences";
        }
        return "AUCA";
    }

    @Transactional
    protected void refreshStudentAcademicSnapshotFromIms(StudentProfile student) {
        if (student == null || isBlank(student.getStudentNumber()) || !imsStudentGatewayService.isConfigured()) {
            return;
        }
        imsStudentGatewayService.findStudentById(student.getStudentNumber().trim()).ifPresent(ims -> {
            boolean changed = false;

            if (ims.gpa() != null && student.getGpa() != null) {
                if (student.getGpa().compareTo(ims.gpa()) != 0) {
                    student.setGpa(ims.gpa());
                    changed = true;
                }
            } else if (ims.gpa() != null) {
                student.setGpa(ims.gpa());
                changed = true;
            }

            if (ims.earnedCredits() != null && !ims.earnedCredits().equals(student.getCredits())) {
                student.setCredits(ims.earnedCredits());
                changed = true;
            }

            if (ims.semester() != null && !ims.semester().equals(student.getSemester())) {
                student.setSemester(ims.semester());
                changed = true;
            }

            if (!isBlank(ims.program()) && !ims.program().equalsIgnoreCase(student.getProgram())) {
                student.setProgram(ims.program());
                changed = true;
            }

            if ("ACTIVE".equalsIgnoreCase(ims.status())
                    && student.getDisciplineStatus() != DisciplineStatus.SATISFACTORY) {
                student.setDisciplineStatus(DisciplineStatus.SATISFACTORY);
                changed = true;
            }

            if (changed) {
                studentProfileRepository.save(student);
            }
        });
    }
}
