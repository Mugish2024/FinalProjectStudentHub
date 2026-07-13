package aucasa.com.rw.repository;

import aucasa.com.rw.domain.PasswordResetToken;
import aucasa.com.rw.domain.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    void deleteByUserAccountAndUsedAtIsNull(UserAccount userAccount);
}
