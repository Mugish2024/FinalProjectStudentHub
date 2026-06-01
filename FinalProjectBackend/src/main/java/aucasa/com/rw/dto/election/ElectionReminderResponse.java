package aucasa.com.rw.dto.election;

public class ElectionReminderResponse {
    private Long electionId;
    private Long remindersSent;
    private Long notVoted;
    private String message;

    public ElectionReminderResponse(Long electionId, Long remindersSent, Long notVoted, String message) {
        this.electionId = electionId;
        this.remindersSent = remindersSent;
        this.notVoted = notVoted;
        this.message = message;
    }

    public Long getElectionId() { return electionId; }
    public Long getRemindersSent() { return remindersSent; }
    public Long getNotVoted() { return notVoted; }
    public String getMessage() { return message; }
}
