package aucasa.com.rw.service;

import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AccountStatus;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.dto.admin.CreateSystemUserRequest;
import aucasa.com.rw.dto.admin.PromoteStudentRoleRequest;
import aucasa.com.rw.dto.admin.UpdateSystemUserRequest;
import aucasa.com.rw.dto.user.UserDirectoryItem;
import aucasa.com.rw.repository.RoleRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {
    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;

    public AdminUserService(UserAccountRepository userAccountRepository,
                            StudentProfileRepository studentProfileRepository,
                            RoleRepository roleRepository,
                            PasswordEncoder passwordEncoder,
                            PasswordPolicyService passwordPolicyService) {
        this.userAccountRepository = userAccountRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
    }

    @Transactional
    public UserDirectoryItem createSystemUser(CreateSystemUserRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        String username = trim(request.getUsername());
        String email = trim(request.getEmail()).toLowerCase(Locale.ROOT);
        String password = trim(request.getPassword());
        String firstName = trim(request.getFirstName());
        String lastName = trim(request.getLastName());
        String roleInput = trim(request.getRole());

        if (username.isEmpty() || email.isEmpty() || password.isEmpty() || firstName.isEmpty() || lastName.isEmpty() || roleInput.isEmpty()) {
            throw new IllegalArgumentException("username, email, password, firstName, lastName, and role are required.");
        }
        passwordPolicyService.validate(password);

        RoleType roleType = parseRole(roleInput);
        if (roleType == RoleType.STUDENT) {
            throw new IllegalArgumentException("Use student registration endpoint for STUDENT role.");
        }

        if (userAccountRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists.");
        }
        if (userAccountRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists.");
        }

        Role role = getOrCreateRole(roleType);

        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setStatus(AccountStatus.ACTIVE);

        UserAccount saved = userAccountRepository.save(user);
        return new UserDirectoryItem(
                saved.getId(),
                saved.getFirstName() + " " + saved.getLastName(),
                saved.getRole().getName().name().toLowerCase(Locale.ROOT),
                null
        );
    }

    @Transactional(readOnly = true)
    public List<UserDirectoryItem> listSystemUsers() {
        return userAccountRepository.findAll().stream()
                .filter(user -> user.getRole() != null && user.getRole().getName() != RoleType.STUDENT)
                .map(this::toDirectoryItem)
                .toList();
    }

    @Transactional
    public UserDirectoryItem promoteStudentToLeadership(PromoteStudentRoleRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        String studentNumber = trim(request.getStudentNumber());
        if (studentNumber.isEmpty()) {
            throw new IllegalArgumentException("studentNumber is required.");
        }

        RoleType roleType = parseRole(request.getRole());
        if (!isLeadershipRole(roleType)) {
            throw new IllegalArgumentException("Only elected leadership roles can be assigned here.");
        }

        StudentProfile student = studentProfileRepository.findByStudentNumber(studentNumber)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));
        String username = trim(request.getUsername());
        String password = trim(request.getPassword());
        if (username.isEmpty() || password.isEmpty()) {
            throw new IllegalArgumentException("username and password are required for the separate leadership account.");
        }
        passwordPolicyService.validate(password);
        if (userAccountRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists.");
        }

        String email = trim(request.getEmail()).toLowerCase(Locale.ROOT);
        if (email.isEmpty()) {
            email = username.toLowerCase(Locale.ROOT) + "@aucasa.local";
        }
        if (userAccountRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists.");
        }

        UserAccount source = student.getUserAccount();
        UserAccount leadershipUser = new UserAccount();
        leadershipUser.setUsername(username);
        leadershipUser.setEmail(email);
        leadershipUser.setPasswordHash(passwordEncoder.encode(password));
        leadershipUser.setFirstName(source != null ? source.getFirstName() : "Student");
        leadershipUser.setLastName(source != null ? source.getLastName() : student.getStudentNumber());
        leadershipUser.setRole(getOrCreateRole(roleType));
        leadershipUser.setStatus(AccountStatus.ACTIVE);
        UserAccount saved = userAccountRepository.save(leadershipUser);
        return toDirectoryItem(saved);
    }

    @Transactional
    public UserDirectoryItem updateSystemUser(Long userId, UpdateSystemUserRequest request) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required.");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (user.getRole() == null || user.getRole().getName() == RoleType.STUDENT) {
            throw new IllegalArgumentException("Only system users can be updated here.");
        }

        String username = trim(request.getUsername());
        String email = trim(request.getEmail()).toLowerCase(Locale.ROOT);
        String password = trim(request.getPassword());
        String firstName = trim(request.getFirstName());
        String lastName = trim(request.getLastName());
        String roleInput = trim(request.getRole());

        if (username.isEmpty() || email.isEmpty() || firstName.isEmpty() || lastName.isEmpty() || roleInput.isEmpty()) {
            throw new IllegalArgumentException("username, email, firstName, lastName, and role are required.");
        }
        if (!password.isEmpty()) {
            passwordPolicyService.validate(password);
        }

        RoleType roleType = parseRole(roleInput);
        if (roleType == RoleType.STUDENT) {
            throw new IllegalArgumentException("Use student registration endpoint for STUDENT role.");
        }

        userAccountRepository.findByUsername(username).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new IllegalArgumentException("Username already exists.");
            }
        });

        userAccountRepository.findByEmail(email).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new IllegalArgumentException("Email already exists.");
            }
        });

        Role role = getOrCreateRole(roleType);

        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        if (!password.isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(password));
        }

        UserAccount saved = userAccountRepository.save(user);
        return new UserDirectoryItem(
                saved.getId(),
                saved.getFirstName() + " " + saved.getLastName(),
                saved.getRole().getName().name().toLowerCase(Locale.ROOT),
                null,
                saved.getUsername(),
                saved.getEmail(),
                saved.getFirstName(),
                saved.getLastName()
        );
    }

    private RoleType parseRole(String roleRaw) {
        String normalized = roleRaw.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        return Arrays.stream(RoleType.values())
                .filter(role -> role.name().equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported role: " + roleRaw));
    }

    private Role getOrCreateRole(RoleType roleType) {
        return roleRepository.findByName(roleType).orElseGet(() -> {
            Role created = new Role();
            created.setName(roleType);
            return roleRepository.save(created);
        });
    }

    private boolean isLeadershipRole(RoleType roleType) {
        return roleType == RoleType.GUILD_PRESIDENT
                || roleType == RoleType.FINANCE
                || roleType == RoleType.MINISTER_SPORT
                || roleType == RoleType.MINISTER_EVANGELISM
                || roleType == RoleType.MINISTER_INTERNATIONAL_AFFAIRS;
    }

    private UserDirectoryItem toDirectoryItem(UserAccount user) {
        StudentProfile student = studentProfileRepository.findByUserAccountId(user.getId()).orElse(null);
        return new UserDirectoryItem(
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                user.getRole().getName().name().toLowerCase(Locale.ROOT),
                student != null ? student.getStudentNumber() : null,
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                student != null && student.getDisciplineStatus() != null ? student.getDisciplineStatus().name() : null
        );
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
