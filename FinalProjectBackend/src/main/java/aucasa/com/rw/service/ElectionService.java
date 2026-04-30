package aucasa.com.rw.service;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.domain.enums.ElectionStatus;
import aucasa.com.rw.repository.ElectionRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ElectionService {
    private final ElectionRepository repository;
    private static final Set<ElectionStatus> ACTIVE_STATUSES = Set.of(
            ElectionStatus.DRAFT,
            ElectionStatus.NOMINATION,
            ElectionStatus.CAMPAIGN,
            ElectionStatus.VOTING
    );

    public ElectionService(ElectionRepository repository) {
        this.repository = repository;
    }

    public List<Election> findAll() { return repository.findAll(); }
    public Optional<Election> findById(Long id) { return repository.findById(id); }
    public Election create(Election entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }

    @Transactional(readOnly = true)
    public Optional<Election> findActiveElection() {
        return repository.findAllByOrderByIdDesc().stream()
                .filter(election -> election.getStatus() != null && ACTIVE_STATUSES.contains(election.getStatus()))
                .findFirst();
    }

    @Transactional
    public Election openVoting(Long id) {
        Election election = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Election not found."));

        LocalDateTime now = LocalDateTime.now();
        election.setStatus(ElectionStatus.VOTING);
        if (election.getVotingStart() == null || election.getVotingStart().isAfter(now)) {
            election.setVotingStart(now);
        }
        if (election.getVotingEnd() == null || !election.getVotingEnd().isAfter(now)) {
            election.setVotingEnd(now.plusDays(1));
        }
        return repository.save(election);
    }

    @Transactional
    public Election closeVoting(Long id) {
        Election election = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Election not found."));

        LocalDateTime now = LocalDateTime.now();
        election.setStatus(ElectionStatus.CLOSED);
        if (election.getVotingEnd() == null || election.getVotingEnd().isAfter(now)) {
            election.setVotingEnd(now);
        }
        return repository.save(election);
    }

    @Transactional
    public Election updateStatus(Long id, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("status is required.");
        }

        Election election = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Election not found."));

        ElectionStatus nextStatus;
        try {
            nextStatus = ElectionStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid election status.");
        }

        election.setStatus(nextStatus);
        return repository.save(election);
    }
}
