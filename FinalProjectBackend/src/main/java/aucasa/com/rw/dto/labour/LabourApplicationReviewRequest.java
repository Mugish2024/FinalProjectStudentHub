package aucasa.com.rw.dto.labour;

public class LabourApplicationReviewRequest {
    private String decision;
    private String reviewerDepartment;
    private Long reviewerUserId;
    private String notes;

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getReviewerDepartment() {
        return reviewerDepartment;
    }

    public void setReviewerDepartment(String reviewerDepartment) {
        this.reviewerDepartment = reviewerDepartment;
    }

    public Long getReviewerUserId() {
        return reviewerUserId;
    }

    public void setReviewerUserId(Long reviewerUserId) {
        this.reviewerUserId = reviewerUserId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
