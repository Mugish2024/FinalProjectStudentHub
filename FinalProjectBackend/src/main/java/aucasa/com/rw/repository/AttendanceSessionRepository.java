package aucasa.com.rw.repository;

import aucasa.com.rw.domain.AttendanceSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByActiveTrue();
}
