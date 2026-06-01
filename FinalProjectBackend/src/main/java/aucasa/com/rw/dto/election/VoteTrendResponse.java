package aucasa.com.rw.dto.election;

public class VoteTrendResponse {
    private Long candidateId;
    private String candidateName;
    private String studentNumber;
    private String position;
    private Long votes;
    private Double percentage;

    public VoteTrendResponse(
            Long candidateId,
            String candidateName,
            String studentNumber,
            String position,
            Long votes,
            Double percentage
    ) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.studentNumber = studentNumber;
        this.position = position;
        this.votes = votes;
        this.percentage = percentage;
    }

    public Long getCandidateId() {
        return candidateId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getPosition() {
        return position;
    }

    public Long getVotes() {
        return votes;
    }

    public Double getPercentage() {
        return percentage;
    }
}
