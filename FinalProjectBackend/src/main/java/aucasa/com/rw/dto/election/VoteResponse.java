package aucasa.com.rw.dto.election;

public class VoteResponse {
    private String status;
    private String message;

    public VoteResponse(String status, String message) {
        this.status = status;
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
