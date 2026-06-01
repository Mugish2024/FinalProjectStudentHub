package aucasa.com.rw.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(10);
    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(String usernameOrEmail) {
        String key = key(usernameOrEmail);
        AttemptState state = attempts.get(key);
        if (state == null || state.lockedUntil == null) {
            return;
        }
        if (Instant.now().isAfter(state.lockedUntil)) {
            attempts.remove(key);
            return;
        }
        throw new IllegalArgumentException("Too many failed login attempts. Please try again in a few minutes.");
    }

    public void recordFailure(String usernameOrEmail) {
        String key = key(usernameOrEmail);
        attempts.compute(key, (ignored, current) -> {
            AttemptState next = current == null ? new AttemptState() : current;
            next.failedAttempts += 1;
            if (next.failedAttempts >= MAX_ATTEMPTS) {
                next.lockedUntil = Instant.now().plus(LOCK_DURATION);
            }
            return next;
        });
    }

    public void recordSuccess(String usernameOrEmail) {
        attempts.remove(key(usernameOrEmail));
    }

    private String key(String usernameOrEmail) {
        return usernameOrEmail == null ? "" : usernameOrEmail.trim().toLowerCase(Locale.ROOT);
    }

    private static class AttemptState {
        private int failedAttempts;
        private Instant lockedUntil;
    }
}
