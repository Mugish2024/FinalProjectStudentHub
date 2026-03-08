package aucasa.com.rw.repository;

import aucasa.com.rw.domain.AcademicTerm;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcademicTermRepository extends JpaRepository<AcademicTerm, Long> {
    Optional<AcademicTerm> findByActiveTrue();
}
