package aucasa.com.rw.repository;

import aucasa.com.rw.domain.RegistrationRecord;
import aucasa.com.rw.domain.enums.RegistrationStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationRecordRepository extends JpaRepository<RegistrationRecord, Long> {
    List<RegistrationRecord> findByStudentId(Long studentId);
    List<RegistrationRecord> findByTermIdAndStatus(Long termId, RegistrationStatus status);
}
