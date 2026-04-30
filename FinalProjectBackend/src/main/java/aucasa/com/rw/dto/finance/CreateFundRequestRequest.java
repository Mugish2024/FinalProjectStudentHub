package aucasa.com.rw.dto.finance;

public class CreateFundRequestRequest {
    private Long budgetId;
    private String requestType;
    private String title;
    private String department;
    private String requestedBy;
    private String purpose;
    private String requestedAmount;
    private String allocationStartDate;
    private String allocationEndDate;
    private String actorRole;
    private String invoiceAttachmentPath;

    public Long getBudgetId() {
        return budgetId;
    }

    public void setBudgetId(Long budgetId) {
        this.budgetId = budgetId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(String requestedAmount) {
        this.requestedAmount = requestedAmount;
    }

    public String getAllocationStartDate() {
        return allocationStartDate;
    }

    public void setAllocationStartDate(String allocationStartDate) {
        this.allocationStartDate = allocationStartDate;
    }

    public String getAllocationEndDate() {
        return allocationEndDate;
    }

    public void setAllocationEndDate(String allocationEndDate) {
        this.allocationEndDate = allocationEndDate;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getInvoiceAttachmentPath() {
        return invoiceAttachmentPath;
    }

    public void setInvoiceAttachmentPath(String invoiceAttachmentPath) {
        this.invoiceAttachmentPath = invoiceAttachmentPath;
    }
}
