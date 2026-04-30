package aucasa.com.rw.dto.finance;

public class UpdateBudgetStatusRequest {
    private String status;
    private String actorRole;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }
}
