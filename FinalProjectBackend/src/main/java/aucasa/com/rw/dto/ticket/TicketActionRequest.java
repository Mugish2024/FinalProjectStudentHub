package aucasa.com.rw.dto.ticket;

public class TicketActionRequest {
    private Long userId;
    private String message;
    private boolean respondToAll;
    private Long forwardToUserId;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRespondToAll() {
        return respondToAll;
    }

    public void setRespondToAll(boolean respondToAll) {
        this.respondToAll = respondToAll;
    }

    public Long getForwardToUserId() {
        return forwardToUserId;
    }

    public void setForwardToUserId(Long forwardToUserId) {
        this.forwardToUserId = forwardToUserId;
    }
}
