package aucasa.com.rw.service;

import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.DisciplineStatus;
import aucasa.com.rw.dto.auth.AccountSetupRequest;
import aucasa.com.rw.dto.auth.LoginRequest;
import aucasa.com.rw.dto.auth.LoginResponse;
import aucasa.com.rw.dto.student.StudentRegistrationRequest;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentProfileService studentProfileService;
    private final ImsStudentGatewayService imsStudentGatewayService;

    public AuthService(
            UserAccountRepository userAccountRepository,
            StudentProfileRepository studentProfileRepository,
            PasswordEncoder passwordEncoder,
            StudentProfileService studentProfileService,
            ImsStudentGatewayService imsStudentGatewayService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentProfileService = studentProfileService;
        this.imsStudentGatewayService = imsStudentGatewayService;
    }

    @Transactional
    public void setupAccount(AccountSetupRequest request) {
        if (request == null || isBlank(request.getStudentNumber()) || isBlank(request.getPassword())) {
            throw new IllegalArgumentException("studentNumber and password are required.");
        }

        String studentNumber = request.getStudentNumber().trim();
        StudentProfile student = studentProfileRepository
                .findByStudentNumber(studentNumber)
                .orElseGet(() -> importStudentFromIms(studentNumber));

        UserAccount user = student.getUserAccount();
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userAccountRepository.save(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (request == null || isBlank(request.getUsernameOrEmail()) || isBlank(request.getPassword())) {
            throw new IllegalArgumentException("usernameOrEmail and password are required.");
        }

        String input = request.getUsernameOrEmail().trim();
        Optional<UserAccount> userOpt = userAccountRepository.findByEmail(input);
        if (userOpt.isEmpty()) {
            String normalized = normalizeUsername(input);
            userOpt = userAccountRepository.findByUsername(normalized);
        }

        UserAccount user = userOpt.orElseThrow(() -> new IllegalArgumentException("Invalid credentials."));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials.");
        }

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

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
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
