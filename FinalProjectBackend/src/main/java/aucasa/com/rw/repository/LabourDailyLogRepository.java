package aucasa.com.rw.repository;

import aucasa.com.rw.domain.LabourDailyLog;
import aucasa.com.rw.domain.enums.LabourLogStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabourDailyLogRepository extends JpaRepository<LabourDailyLog, Long> {
    List<LabourDailyLog> findByApplicationId(Long applicationId);
    List<LabourDailyLog> findByStatus(LabourLogStatus status);
}
