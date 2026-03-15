package aucasa.com.rw.repository;

import aucasa.com.rw.domain.LabourApplication;
import aucasa.com.rw.domain.enums.LabourApplicationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabourApplicationRepository extends JpaRepository<LabourApplication, Long> {
    List<LabourApplication> findByStudentId(Long studentId);
    List<LabourApplication> findByStatus(LabourApplicationStatus status);
    List<LabourApplication> findByStudentStudentNumber(String studentNumber);
    List<LabourApplication> findByStatusAndDepartmentNameIgnoreCase(LabourApplicationStatus status, String departmentName);
    Optional<LabourApplication> findFirstByStudentIdAndStatusOrderBySubmittedAtDesc(Long studentId, LabourApplicationStatus status);
}
