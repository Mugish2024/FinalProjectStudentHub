package aucasa.com.rw.service;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.domain.ElectionCandidate;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.Vote;
import aucasa.com.rw.domain.enums.ElectionStatus;
import aucasa.com.rw.dto.election.VoteRequest;
import aucasa.com.rw.dto.election.VoteResponse;
import aucasa.com.rw.repository.ElectionCandidateRepository;
import aucasa.com.rw.repository.ElectionRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.VoteRepository;
import java.time.LocalDateTime;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VoteService {
    private final VoteRepository voteRepository;
    private final ElectionCandidateRepository candidateRepository;
    private final ElectionRepository electionRepository;
    private final StudentProfileRepository studentProfileRepository;

    public VoteService(
            VoteRepository voteRepository,
            ElectionCandidateRepository candidateRepository,
            ElectionRepository electionRepository,
            StudentProfileRepository studentProfileRepository
    ) {
        this.voteRepository = voteRepository;
        this.candidateRepository = candidateRepository;
        this.electionRepository = electionRepository;
        this.studentProfileRepository = studentProfileRepository;
    }

    @Transactional
    public VoteResponse castVote(VoteRequest request) {
        if (request == null || request.getCandidateId() == null || isBlank(request.getStudentNumber())) {
            throw new IllegalArgumentException("studentNumber and candidateId are required.");
        }

        StudentProfile voter = studentProfileRepository.findByStudentNumber(request.getStudentNumber().trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        ElectionCandidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found."));

        if (!Boolean.TRUE.equals(candidate.getApproved())) {
            throw new IllegalArgumentException("Candidate is not approved.");
        }

        Election election = candidate.getElection();
        if (election == null) {
            throw new IllegalArgumentException("Election not found.");
        }
        if (election.getStatus() != ElectionStatus.VOTING) {
            throw new IllegalArgumentException("Voting is not open.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (election.getVotingStart() != null && now.isBefore(election.getVotingStart())) {
            throw new IllegalArgumentException("Voting has not started yet.");
        }
        if (election.getVotingEnd() != null && now.isAfter(election.getVotingEnd())) {
            throw new IllegalArgumentException("Voting period has ended.");
        }

        if (voteRepository.findByElectionIdAndVoterId(election.getId(), voter.getId()).isPresent()) {
            throw new IllegalArgumentException("You have already voted in this election.");
        }

        Vote vote = new Vote();
        vote.setElection(election);
        vote.setCandidate(candidate);
        vote.setVoter(voter);
        vote.setVotedAt(now);

        try {
            voteRepository.save(vote);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("You have already voted in this election.");
        }

        int totalVotes = election.getTotalVotes() != null ? election.getTotalVotes() : 0;
        election.setTotalVotes(totalVotes + 1);
        electionRepository.save(election);

        return new VoteResponse("ok", "Vote recorded successfully.");
    }

    @Transactional(readOnly = true)
    public boolean hasStudentVoted(Long electionId, String studentNumber) {
        if (electionId == null || isBlank(studentNumber)) {
            throw new IllegalArgumentException("electionId and studentNumber are required.");
        }
        StudentProfile voter = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));
        return voteRepository.findByElectionIdAndVoterId(electionId, voter.getId()).isPresent();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
