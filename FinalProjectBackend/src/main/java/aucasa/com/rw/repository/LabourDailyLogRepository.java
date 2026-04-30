package aucasa.com.rw.repository;

import aucasa.com.rw.domain.LabourDailyLog;
import aucasa.com.rw.domain.enums.LabourLogStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabourDailyLogRepository extends JpaRepository<LabourDailyLog, Long> {
    List<LabourDailyLog> findByApplicationId(Long applicationId);
    List<LabourDailyLog> findByStatus(LabourLogStatus status);
    List<LabourDailyLog> findByApplicationStudentStudentNumber(String studentNumber);
    Optional<LabourDailyLog> findByApplicationIdAndLogDate(Long applicationId, LocalDate logDate);
    boolean existsByApplicationIdAndLogDate(Long applicationId, LocalDate logDate);
}
