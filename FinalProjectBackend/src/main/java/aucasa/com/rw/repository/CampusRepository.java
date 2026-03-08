package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Campus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampusRepository extends JpaRepository<Campus, Long> {
    Optional<Campus> findByCode(String code);
}
