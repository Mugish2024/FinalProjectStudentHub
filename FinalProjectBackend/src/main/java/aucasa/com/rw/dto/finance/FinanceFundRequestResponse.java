package aucasa.com.rw.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FinanceFundRequestResponse {
    private Long id;
    private Long budgetId;
    private String budgetTitle;
    private String requestType;
    private String status;
    private String title;
    private String department;
    private String requestedBy;
    private String purpose;
    private BigDecimal requestedAmount;
    private BigDecimal approvedAmount;
    private BigDecimal spentAmount;
    private BigDecimal remainingApprovedAmount;
    private LocalDate allocationStartDate;
    private LocalDate allocationEndDate;
    private String guildReviewNote;
    private LocalDateTime guildReviewedAt;
    private String chiefFinanceReviewNote;
    private LocalDateTime chiefFinanceReviewedAt;
    private String communicationMessage;
    private String invoiceAttachmentPath;
    private LocalDateTime lastPublishedAt;
    private LocalDateTime createdAt;

    public FinanceFundRequestResponse(Long id,
                                      Long budgetId,
                                      String budgetTitle,
                                      String requestType,
                                      String status,
                                      String title,
                                      String department,
                                      String requestedBy,
                                      String purpose,
                                      BigDecimal requestedAmount,
                                      BigDecimal approvedAmount,
                                      BigDecimal spentAmount,
                                      BigDecimal remainingApprovedAmount,
                                      LocalDate allocationStartDate,
                                      LocalDate allocationEndDate,
                                      String guildReviewNote,
                                      LocalDateTime guildReviewedAt,
                                      String chiefFinanceReviewNote,
                                      LocalDateTime chiefFinanceReviewedAt,
                                      String communicationMessage,
                                      String invoiceAttachmentPath,
                                      LocalDateTime lastPublishedAt,
                                      LocalDateTime createdAt) {
        this.id = id;
        this.budgetId = budgetId;
        this.budgetTitle = budgetTitle;
        this.requestType = requestType;
        this.status = status;
        this.title = title;
        this.department = department;
        this.requestedBy = requestedBy;
        this.purpose = purpose;
        this.requestedAmount = requestedAmount;
        this.approvedAmount = approvedAmount;
        this.spentAmount = spentAmount;
        this.remainingApprovedAmount = remainingApprovedAmount;
        this.allocationStartDate = allocationStartDate;
        this.allocationEndDate = allocationEndDate;
        this.guildReviewNote = guildReviewNote;
        this.guildReviewedAt = guildReviewedAt;
        this.chiefFinanceReviewNote = chiefFinanceReviewNote;
        this.chiefFinanceReviewedAt = chiefFinanceReviewedAt;
        this.communicationMessage = communicationMessage;
        this.invoiceAttachmentPath = invoiceAttachmentPath;
        this.lastPublishedAt = lastPublishedAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getBudgetId() {
        return budgetId;
    }

    public String getBudgetTitle() {
        return budgetTitle;
    }

    public String getRequestType() {
        return requestType;
    }

    public String getStatus() {
        return status;
    }

    public String getTitle() {
        return title;
    }

    public String getDepartment() {
        return department;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public String getPurpose() {
        return purpose;
    }

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public BigDecimal getSpentAmount() {
        return spentAmount;
    }

    public BigDecimal getRemainingApprovedAmount() {
        return remainingApprovedAmount;
    }

    public LocalDate getAllocationStartDate() {
        return allocationStartDate;
    }

    public LocalDate getAllocationEndDate() {
        return allocationEndDate;
    }

    public String getGuildReviewNote() {
        return guildReviewNote;
    }

    public LocalDateTime getGuildReviewedAt() {
        return guildReviewedAt;
    }

    public String getChiefFinanceReviewNote() {
        return chiefFinanceReviewNote;
    }

    public LocalDateTime getChiefFinanceReviewedAt() {
        return chiefFinanceReviewedAt;
    }

    public String getCommunicationMessage() {
        return communicationMessage;
    }

    public String getInvoiceAttachmentPath() {
        return invoiceAttachmentPath;
    }

    public LocalDateTime getLastPublishedAt() {
        return lastPublishedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
