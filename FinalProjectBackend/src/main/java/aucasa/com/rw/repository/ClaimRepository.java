package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Claim;
import aucasa.com.rw.domain.enums.ClaimStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByStudentId(Long studentId);
    List<Claim> findByStatus(ClaimStatus status);
    Optional<Claim> findByReferenceCode(String referenceCode);
}
