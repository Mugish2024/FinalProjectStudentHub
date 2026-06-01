package aucasa.com.rw.dto.election;

public class ElectionStatisticsResponse {
    private Long electionId;
    private String title;
    private String status;
    private Long eligibleVoters;
    private Long votesCast;
    private Long notVoted;
    private Double turnoutRate;
    private String leadingCandidate;
    private Long leadingCandidateVotes;

    public ElectionStatisticsResponse(Long electionId, String title, String status, Long eligibleVoters, Long votesCast, Long notVoted, Double turnoutRate, String leadingCandidate, Long leadingCandidateVotes) {
        this.electionId = electionId;
        this.title = title;
        this.status = status;
        this.eligibleVoters = eligibleVoters;
        this.votesCast = votesCast;
        this.notVoted = notVoted;
        this.turnoutRate = turnoutRate;
        this.leadingCandidate = leadingCandidate;
        this.leadingCandidateVotes = leadingCandidateVotes;
    }

    public Long getElectionId() { return electionId; }
    public String getTitle() { return title; }
    public String getStatus() { return status; }
    public Long getEligibleVoters() { return eligibleVoters; }
    public Long getVotesCast() { return votesCast; }
    public Long getNotVoted() { return notVoted; }
    public Double getTurnoutRate() { return turnoutRate; }
    public String getLeadingCandidate() { return leadingCandidate; }
    public Long getLeadingCandidateVotes() { return leadingCandidateVotes; }
}
