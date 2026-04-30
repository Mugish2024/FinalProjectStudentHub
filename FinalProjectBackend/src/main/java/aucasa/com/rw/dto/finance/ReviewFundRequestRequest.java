package aucasa.com.rw.dto.finance;

public class ReviewFundRequestRequest {
    private String actorRole;
    private String decision;
    private String note;
    private String approvedAmount;
    private String communicationMessage;

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(String approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public String getCommunicationMessage() {
        return communicationMessage;
    }

    public void setCommunicationMessage(String communicationMessage) {
        this.communicationMessage = communicationMessage;
    }
}
