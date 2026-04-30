package aucasa.com.rw.repository;

import aucasa.com.rw.domain.LabourBackfillApproval;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabourBackfillApprovalRepository extends JpaRepository<LabourBackfillApproval, Long> {
    Optional<LabourBackfillApproval> findFirstByStudentIdAndActiveTrueOrderByApprovedAtDesc(Long studentId);
}
