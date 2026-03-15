package aucasa.com.rw.repository;

import aucasa.com.rw.domain.ElectionCandidate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ElectionCandidateRepository extends JpaRepository<ElectionCandidate, Long> {
    List<ElectionCandidate> findByElectionId(Long electionId);
    List<ElectionCandidate> findByApprovedTrue();
    List<ElectionCandidate> findByApprovedFalse();
}
