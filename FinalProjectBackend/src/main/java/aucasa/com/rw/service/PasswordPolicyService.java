package aucasa.com.rw.service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class PasswordPolicyService {
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 72;
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern NUMBER = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9]");
    private static final List<String> COMMON_WEAK_PASSWORDS = List.of(
            "auca123",
            "password123",
            "12345678",
            "admin123",
            "qwerty",
            "password",
            "admin",
            "letmein",
            "welcome",
            "student123",
            "aucasa123"
    );

    public void validate(String password) {
        String value = password == null ? "" : password;
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (value.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }
        if (value.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Password is too long. Use 72 characters or fewer.");
        }
        if (!UPPERCASE.matcher(value).find()) {
            throw new IllegalArgumentException("Password must include at least one uppercase letter.");
        }
        if (!LOWERCASE.matcher(value).find()) {
            throw new IllegalArgumentException("Password must include at least one lowercase letter.");
        }
        if (!NUMBER.matcher(value).find()) {
            throw new IllegalArgumentException("Password must include at least one number.");
        }
        if (!SPECIAL.matcher(value).find()) {
            throw new IllegalArgumentException("Password must include at least one special character.");
        }
        if (COMMON_WEAK_PASSWORDS.contains(normalized)) {
            throw new IllegalArgumentException("This password is too common. Please choose a stronger password.");
        }
        if (hasRepeatedSequence(normalized)) {
            throw new IllegalArgumentException("Password contains an unsafe repeated pattern.");
        }
    }

    private boolean hasRepeatedSequence(String value) {
        if (value.length() < 8) {
            return false;
        }
        for (int size = 2; size <= 4; size++) {
            for (int i = 0; i + (size * 3) <= value.length(); i++) {
                String token = value.substring(i, i + size);
                if (value.substring(i + size, i + (size * 2)).equals(token)
                        && value.substring(i + (size * 2), i + (size * 3)).equals(token)) {
                    return true;
                }
            }
        }
        return false;
    }
}
