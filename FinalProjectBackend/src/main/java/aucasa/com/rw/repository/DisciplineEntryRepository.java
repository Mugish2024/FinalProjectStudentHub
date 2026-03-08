package aucasa.com.rw.repository;

import aucasa.com.rw.domain.DisciplineEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisciplineEntryRepository extends JpaRepository<DisciplineEntry, Long> {
    List<DisciplineEntry> findByRecordId(Long recordId);
}
