package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Faculty;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByCode(String code);
    Optional<Faculty> findByNameIgnoreCase(String name);
}
