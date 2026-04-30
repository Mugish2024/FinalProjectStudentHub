package aucasa.com.rw.repository;

import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.RoleType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmail(String email);
    Optional<UserAccount> findByUsername(String username);
    List<UserAccount> findByRoleName(RoleType name);
}
