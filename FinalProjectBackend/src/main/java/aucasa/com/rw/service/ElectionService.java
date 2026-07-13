package aucasa.com.rw.service;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.domain.ElectionCandidate;
import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AccountStatus;
import aucasa.com.rw.domain.enums.ElectionStatus;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.dto.election.ElectionReminderResponse;
import aucasa.com.rw.dto.election.ElectionStatisticsResponse;
import aucasa.com.rw.dto.election.VoteTrendResponse;
import aucasa.com.rw.repository.ElectionCandidateRepository;
import aucasa.com.rw.repository.ElectionRepository;
import aucasa.com.rw.repository.RoleRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import aucasa.com.rw.repository.VoteRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ElectionService {
    private final ElectionRepository repository;
    private final ElectionCandidateRepository candidateRepository;
    private final VoteRepository voteRepository;
    private final RoleRepository roleRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private static final Set<ElectionStatus> ACTIVE_STATUSES = Set.of(
            ElectionStatus.DRAFT,
            ElectionStatus.NOMINATION,
            ElectionStatus.CAMPAIGN,
            ElectionStatus.VOTING
    );

    public ElectionService(ElectionRepository repository,
                           ElectionCandidateRepository candidateRepository,
                           VoteRepository voteRepository,
                           RoleRepository roleRepository,
                           StudentProfileRepository studentProfileRepository,
                           UserAccountRepository userAccountRepository) {
        this.repository = repository;
        this.candidateRepository = candidateRepository;
        this.voteRepository = voteRepository;
        this.roleRepository = roleRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public List<Election> findAll() { return repository.findAll(); }
    public Optional<Election> findById(Long id) { return repository.findById(id); }
    @Transactional
    public Election create(Election entity) {
        LocalDateTime now = LocalDateTime.now();
        validateElectionProcessRange(entity.getNominationStart(), entity.getVotingEnd(), now);
        validateVotingDayRange(entity.getVotingStart(), entity.getVotingEnd(), now, "Voting day");
        if (!entity.getVotingStart().toLocalDate().equals(entity.getVotingEnd().toLocalDate())) {
            throw new IllegalArgumentException("Voting day must be on the final date of the election process.");
        }
        clearPreviousElectionParticipation();
        entity.setEligibleVoters((int) resolveEligibleVoters());
        return repository.save(entity);
    }
    public void delete(Long id) { repository.deleteById(id); }

    @Transactional
    public Election updateVoteProgressVisibility(Long id, Boolean visible) {
        if (visible == null) {
            throw new IllegalArgumentException("visible is required.");
        }
        Election election = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Election not found."));
        election.setShowVoteProgress(visible);
        return repository.save(election);
    }

    @Transactional(readOnly = true)
    public List<VoteTrendResponse> getVoteTrends(Long electionId) {
        Election election = repository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found."));
        List<ElectionCandidate> candidates = candidateRepository.findByElectionId(election.getId()).stream()
                .filter(candidate -> Boolean.TRUE.equals(candidate.getApproved()))
                .toList();
        Map<Long, Long> votesByCandidate = voteRepository.findByElectionId(election.getId()).stream()
                .collect(Collectors.groupingBy(vote -> vote.getCandidate().getId(), Collectors.counting()));
        long totalVotes = votesByCandidate.values().stream().mapToLong(Long::longValue).sum();

        return candidates.stream()
                .sorted(Comparator
                        .comparingLong((ElectionCandidate candidate) -> votesByCandidate.getOrDefault(candidate.getId(), 0L))
                        .reversed()
                        .thenComparing(ElectionCandidate::getId))
                .map(candidate -> {
                    long votes = votesByCandidate.getOrDefault(candidate.getId(), 0L);
                    double percentage = totalVotes > 0 ? (votes * 100.0) / totalVotes : 0.0;
                    String studentName = candidate.getStudent() != null && candidate.getStudent().getUserAccount() != null
                            ? candidate.getStudent().getUserAccount().getFirstName() + " " + candidate.getStudent().getUserAccount().getLastName()
                            : "Unknown candidate";
                    String studentNumber = candidate.getStudent() != null ? candidate.getStudent().getStudentNumber() : "";
                    return new VoteTrendResponse(
                            candidate.getId(),
                            studentName,
                            studentNumber,
                            candidate.getPosition(),
                            votes,
                            Math.round(percentage * 10.0) / 10.0
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ElectionStatisticsResponse getElectionStatistics(Long electionId) {
        Election election = repository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found."));
        long eligibleVoters = resolveEligibleVoters();
        long votesCast = voteRepository.countByElectionId(election.getId());
        long notVoted = Math.max(eligibleVoters - votesCast, 0L);
        double turnoutRate = eligibleVoters > 0 ? (votesCast * 100.0) / eligibleVoters : 0.0;
        List<VoteTrendResponse> trends = getVoteTrends(electionId);
        VoteTrendResponse leader = trends.isEmpty() ? null : trends.get(0);

        return new ElectionStatisticsResponse(
                election.getId(),
                election.getTitle(),
                election.getStatus() != null ? election.getStatus().name() : "",
                eligibleVoters,
                votesCast,
                notVoted,
                Math.round(turnoutRate * 10.0) / 10.0,
                leader != null ? leader.getCandidateName() : "No votes yet",
                leader != null ? leader.getVotes() : 0L
        );
    }

    @Transactional(readOnly = true)
    public ElectionReminderResponse sendVotingReminders(Long electionId) {
        ElectionStatisticsResponse statistics = getElectionStatistics(electionId);
        long remindersSent = Math.max(statistics.getNotVoted(), 0L);
        String message = remindersSent > 0
                ? "Reminder sent to " + remindersSent + " student(s) who have not voted yet."
                : "All expected students have already voted. No reminder is needed.";
        return new ElectionReminderResponse(electionId, remindersSent, statistics.getNotVoted(), message);
    }

    private long resolveEligibleVoters() {
        return studentProfileRepository.count();
    }

    private void clearPreviousElectionParticipation() {
        voteRepository.deleteAllInBatch();
        candidateRepository.deleteAllInBatch();
    }

    @Transactional(readOnly = true)
    public Optional<Election> findActiveElection() {
        return repository.findAllByOrderByIdDesc().stream()
                .filter(election -> election.getStatus() != null && ACTIVE_STATUSES.contains(election.getStatus()))
                .findFirst();
    }

    @Transactional
    public Election openVoting(Long id) {
        return openVoting(id, null, null);
    }

    @Transactional
    public Election openVoting(Long id, LocalDateTime requestedStart, LocalDateTime requestedEnd) {
        Election election = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Election not found."));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = requestedStart != null ? requestedStart : now;
        LocalDateTime end = requestedEnd != null ? requestedEnd : now.plusDays(1);
        validateVotingDayRange(start, end, now, "Voting");
        election.setStatus(ElectionStatus.VOTING);
        election.setVotingStart(start);
        election.setVotingEnd(end);
        election.setEligibleVoters((int) resolveEligibleVoters());
        return repository.save(election);
    }

    private void validateVotingDayRange(LocalDateTime start, LocalDateTime end, LocalDateTime now, String label) {
        if (start == null || end == null) {
            throw new IllegalArgumentException(label + " start and end date are required.");
        }
        if (start.isBefore(now.minusMinutes(1))) {
            throw new IllegalArgumentException(label + " start date cannot be in the past.");
        }
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException(label + " end date must be after the start date.");
        }
        if (Duration.between(start, end).compareTo(Duration.ofDays(1)) > 0) {
            throw new IllegalArgumentException(label + " cannot be longer than one day.");
        }
    }

    private void validateElectionProcessRange(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Election process start and end date are required.");
        }
        if (start.isBefore(now.minusMinutes(1))) {
            throw new IllegalArgumentException("Election process start date cannot be in the past.");
        }
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("Election process end date must be after the start date.");
        }
        Duration duration = Duration.between(start, end);
        if (duration.compareTo(Duration.ofDays(15)) < 0) {
            throw new IllegalArgumentException("Election process must be at least 15 days long.");
        }
        if (duration.compareTo(Duration.ofDays(30)) > 0) {
            throw new IllegalArgumentException("Election process cannot be longer than 30 days.");
        }
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
        Election saved = repository.save(election);
        promoteElectionWinners(saved);
        return saved;
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
        Election saved = repository.save(election);
        if (nextStatus == ElectionStatus.CLOSED) {
            promoteElectionWinners(saved);
        }
        return saved;
    }

    private void promoteElectionWinners(Election election) {
        List<ElectionCandidate> candidates = candidateRepository.findByElectionId(election.getId()).stream()
                .filter(candidate -> Boolean.TRUE.equals(candidate.getApproved()))
                .toList();
        if (candidates.isEmpty()) {
            return;
        }

        Map<Long, Long> votesByCandidate = voteRepository.findByElectionId(election.getId()).stream()
                .collect(Collectors.groupingBy(vote -> vote.getCandidate().getId(), Collectors.counting()));
        Map<String, List<ElectionCandidate>> candidatesByPosition = candidates.stream()
                .collect(Collectors.groupingBy(candidate -> normalizePosition(candidate.getPosition())));

        for (Map.Entry<String, List<ElectionCandidate>> entry : candidatesByPosition.entrySet()) {
            Optional<RoleType> roleType = roleForPosition(entry.getKey());
            if (roleType.isEmpty()) {
                continue;
            }
            entry.getValue().stream()
                    .max(Comparator
                            .comparingLong((ElectionCandidate candidate) -> votesByCandidate.getOrDefault(candidate.getId(), 0L))
                            .thenComparing(ElectionCandidate::getId))
                    .filter(winner -> votesByCandidate.getOrDefault(winner.getId(), 0L) > 0)
                    .ifPresent(winner -> promoteCandidate(winner, roleType.get()));
        }
    }

    private void promoteCandidate(ElectionCandidate candidate, RoleType roleType) {
        if (candidate.getStudent() == null || candidate.getStudent().getUserAccount() == null) {
            return;
        }
        UserAccount studentUser = candidate.getStudent().getUserAccount();
        String baseUsername = normalizeCredentialToken(roleType.name().toLowerCase(Locale.ROOT) + candidate.getStudent().getStudentNumber());
        String username = uniqueUsername(baseUsername);
        String email = username + "@aucasa.local";
        Role role = roleRepository.findByName(roleType).orElseGet(() -> {
            Role created = new Role();
            created.setName(roleType);
            return roleRepository.save(created);
        });

        UserAccount leadershipUser = new UserAccount();
        leadershipUser.setUsername(username);
        leadershipUser.setEmail(email);
        leadershipUser.setPasswordHash(studentUser.getPasswordHash());
        leadershipUser.setFirstName(studentUser.getFirstName());
        leadershipUser.setLastName(studentUser.getLastName());
        leadershipUser.setRole(role);
        leadershipUser.setStatus(AccountStatus.ACTIVE);
        userAccountRepository.save(leadershipUser);
    }

    private String uniqueUsername(String baseUsername) {
        String candidate = baseUsername;
        int suffix = 1;
        while (userAccountRepository.findByUsername(candidate).isPresent()) {
            suffix += 1;
            candidate = baseUsername + suffix;
        }
        return candidate;
    }

    private String normalizeCredentialToken(String value) {
        String normalized = value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        return normalized.isBlank() ? "aucasaleader" : normalized;
    }

    private Optional<RoleType> roleForPosition(String normalizedPosition) {
        Map<String, RoleType> roleMap = new HashMap<>();
        roleMap.put("AUCASA GUILD PRESIDENT", RoleType.GUILD_PRESIDENT);
        roleMap.put("AUCASA GUILD PRESIDENT MASORO CAMPUS", RoleType.GUILD_PRESIDENT);
        roleMap.put("AUCASA GUILD PRESIDENT GISHUSHU CAMPUS", RoleType.GUILD_PRESIDENT);
        roleMap.put("AUCASA GUILD PRESIDENT NURSING AND MIDWIFERY", RoleType.GUILD_PRESIDENT);
        roleMap.put("AUCASA PRESIDENT OF FINANCE", RoleType.FINANCE);
        roleMap.put("AUCASA MINISTER OF EVANGELISM", RoleType.MINISTER_EVANGELISM);
        roleMap.put("AUCASA MINISTER OF SPORT", RoleType.MINISTER_SPORT);
        roleMap.put("AUCASA MINISTER OF INTERNATIONAL STUDENT AND AFFAIRS", RoleType.MINISTER_INTERNATIONAL_AFFAIRS);
        return Optional.ofNullable(roleMap.get(normalizedPosition));
    }

    private String normalizePosition(String position) {
        return position == null ? "" : position.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
    }
}
