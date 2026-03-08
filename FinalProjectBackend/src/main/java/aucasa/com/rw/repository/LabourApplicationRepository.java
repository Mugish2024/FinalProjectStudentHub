package aucasa.com.rw.repository;

import aucasa.com.rw.domain.LabourApplication;
import aucasa.com.rw.domain.enums.LabourApplicationStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabourApplicationRepository extends JpaRepository<LabourApplication, Long> {
    List<LabourApplication> findByStudentId(Long studentId);
    List<LabourApplication> findByStatus(LabourApplicationStatus status);
}
