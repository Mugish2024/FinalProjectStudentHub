package aucasa.com.rw.repository;

import aucasa.com.rw.domain.FinanceCommunicationUpdate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceCommunicationUpdateRepository extends JpaRepository<FinanceCommunicationUpdate, Long> {
    List<FinanceCommunicationUpdate> findTop5ByOrderByCreatedAtDesc();
}
