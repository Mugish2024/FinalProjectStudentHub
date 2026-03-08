package aucasa.com.rw.repository;

import aucasa.com.rw.domain.DisciplineRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisciplineRecordRepository extends JpaRepository<DisciplineRecord, Long> {
    Optional<DisciplineRecord> findByStudentIdAndTermId(Long studentId, Long termId);
    List<DisciplineRecord> findByStudentId(Long studentId);
}
