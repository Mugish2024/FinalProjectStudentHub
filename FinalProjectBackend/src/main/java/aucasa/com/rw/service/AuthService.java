package aucasa.com.rw.service;

import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.dto.auth.AccountSetupRequest;
import aucasa.com.rw.dto.auth.LoginRequest;
import aucasa.com.rw.dto.auth.LoginResponse;
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

    public AuthService(
            UserAccountRepository userAccountRepository,
            StudentProfileRepository studentProfileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userAccountRepository = userAccountRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void setupAccount(AccountSetupRequest request) {
        if (request == null || isBlank(request.getStudentNumber()) || isBlank(request.getPassword())) {
            throw new IllegalArgumentException("studentNumber and password are required.");
        }

        StudentProfile student = studentProfileRepository
                .findByStudentNumber(request.getStudentNumber().trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

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
}
