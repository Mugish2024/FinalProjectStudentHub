package aucasa.com.rw.repository;

import aucasa.com.rw.domain.AttendanceRecord;
import aucasa.com.rw.domain.enums.AttendanceStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByStudentId(Long studentId);
    List<AttendanceRecord> findBySessionIdAndStatus(Long sessionId, AttendanceStatus status);
}
