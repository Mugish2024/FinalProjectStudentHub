package aucasa.com.rw.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.domain.ElectionCandidate;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.enums.ElectionStatus;
import aucasa.com.rw.dto.election.VoteRequest;
import aucasa.com.rw.dto.election.VoteResponse;
import aucasa.com.rw.repository.ElectionCandidateRepository;
import aucasa.com.rw.repository.ElectionRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.VoteRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class VoteServiceTest {

    @Mock
    private VoteRepository voteRepository;

    @Mock
    private ElectionCandidateRepository candidateRepository;

    @Mock
    private ElectionRepository electionRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    private VoteService service;

    @BeforeEach
    void setUp() {
        service = new VoteService(voteRepository, candidateRepository, electionRepository, studentProfileRepository);
    }

    @Test
    void castVoteSucceedsWhenVotingWindowIsOpen() {
        StudentProfile voter = buildVoter(1L);
        Election election = buildElection(ElectionStatus.VOTING, LocalDateTime.now().minusMinutes(10), LocalDateTime.now().plusMinutes(20));
        ElectionCandidate candidate = buildCandidate(7L, election, true);

        VoteRequest request = new VoteRequest();
        request.setStudentNumber("AUCA001");
        request.setCandidateId(7L);

        when(studentProfileRepository.findByStudentNumber("AUCA001")).thenReturn(Optional.of(voter));
        when(candidateRepository.findById(7L)).thenReturn(Optional.of(candidate));
        when(voteRepository.findByElectionIdAndVoterId(20L, 1L)).thenReturn(Optional.empty());
        when(voteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(electionRepository.save(any(Election.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VoteResponse response = service.castVote(request);

        assertEquals("ok", response.getStatus());
        assertEquals("Vote recorded successfully.", response.getMessage());
    }

    @Test
    void castVoteFailsWhenVotingNotStarted() {
        StudentProfile voter = buildVoter(1L);
        Election election = buildElection(ElectionStatus.VOTING, LocalDateTime.now().plusMinutes(10), LocalDateTime.now().plusHours(1));
        ElectionCandidate candidate = buildCandidate(7L, election, true);

        VoteRequest request = new VoteRequest();
        request.setStudentNumber("AUCA001");
        request.setCandidateId(7L);

        when(studentProfileRepository.findByStudentNumber("AUCA001")).thenReturn(Optional.of(voter));
        when(candidateRepository.findById(7L)).thenReturn(Optional.of(candidate));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.castVote(request));
        assertTrue(ex.getMessage().contains("not started"));
    }

    @Test
    void castVoteFailsWhenVotingEnded() {
        StudentProfile voter = buildVoter(1L);
        Election election = buildElection(ElectionStatus.VOTING, LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(1));
        ElectionCandidate candidate = buildCandidate(7L, election, true);

        VoteRequest request = new VoteRequest();
        request.setStudentNumber("AUCA001");
        request.setCandidateId(7L);

        when(studentProfileRepository.findByStudentNumber("AUCA001")).thenReturn(Optional.of(voter));
        when(candidateRepository.findById(7L)).thenReturn(Optional.of(candidate));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.castVote(request));
        assertTrue(ex.getMessage().contains("ended"));
    }

    private StudentProfile buildVoter(Long id) {
        StudentProfile profile = new StudentProfile();
        ReflectionTestUtils.setField(profile, "id", id);
        return profile;
    }

    private Election buildElection(ElectionStatus status, LocalDateTime start, LocalDateTime end) {
        Election election = new Election();
        ReflectionTestUtils.setField(election, "id", 20L);
        election.setStatus(status);
        election.setVotingStart(start);
        election.setVotingEnd(end);
        election.setTotalVotes(0);
        return election;
    }

    private ElectionCandidate buildCandidate(Long id, Election election, boolean approved) {
        ElectionCandidate candidate = new ElectionCandidate();
        ReflectionTestUtils.setField(candidate, "id", id);
        candidate.setElection(election);
        candidate.setApproved(approved);
        return candidate;
    }
}
