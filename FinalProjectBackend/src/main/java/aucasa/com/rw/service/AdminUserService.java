package aucasa.com.rw.service;

import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AccountStatus;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.dto.admin.CreateSystemUserRequest;
import aucasa.com.rw.dto.admin.UpdateSystemUserRequest;
import aucasa.com.rw.dto.user.UserDirectoryItem;
import aucasa.com.rw.repository.RoleRepository;
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
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserAccountRepository userAccountRepository,
                            RoleRepository roleRepository,
                            PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
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
        if (password.length() < 6) {
            throw new IllegalArgumentException("Password must have at least 6 characters.");
        }

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

        Role role = roleRepository.findByName(roleType).orElseGet(() -> {
            Role created = new Role();
            created.setName(roleType);
            return roleRepository.save(created);
        });

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
                .map(user -> new UserDirectoryItem(
                        user.getId(),
                        user.getFirstName() + " " + user.getLastName(),
                        user.getRole().getName().name().toLowerCase(Locale.ROOT),
                        null,
                        user.getUsername(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName()
                ))
                .toList();
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
        if (!password.isEmpty() && password.length() < 6) {
            throw new IllegalArgumentException("Password must have at least 6 characters.");
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

        Role role = roleRepository.findByName(roleType).orElseGet(() -> {
            Role created = new Role();
            created.setName(roleType);
            return roleRepository.save(created);
        });

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

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
