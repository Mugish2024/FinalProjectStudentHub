package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.enums.RoleType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleType name);
}
