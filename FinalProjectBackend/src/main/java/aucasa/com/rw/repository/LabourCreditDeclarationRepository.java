package aucasa.com.rw.repository;

import aucasa.com.rw.domain.LabourCreditDeclaration;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabourCreditDeclarationRepository extends JpaRepository<LabourCreditDeclaration, Long> {
    Optional<LabourCreditDeclaration> findByStudentIdAndTermId(Long studentId, Long termId);
}
