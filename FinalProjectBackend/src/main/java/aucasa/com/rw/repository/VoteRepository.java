package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Vote;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByElectionIdAndVoterId(Long electionId, Long voterId);
    List<Vote> findByElectionId(Long electionId);
    long countByElectionId(Long electionId);
}
