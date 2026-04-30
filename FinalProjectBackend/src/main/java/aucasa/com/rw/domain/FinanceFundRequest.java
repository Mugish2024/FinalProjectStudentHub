package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.FinanceFundRequestStatus;
import aucasa.com.rw.domain.enums.FinanceFundRequestType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "finance_fund_requests")
public class FinanceFundRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id")
    private FinanceBudget budget;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FinanceFundRequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private FinanceFundRequestStatus status = FinanceFundRequestStatus.PENDING_GUILD_APPROVAL;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 120)
    private String department;

    @Column(nullable = false, length = 120)
    private String requestedBy;

    @Column(nullable = false, length = 1200)
    private String purpose;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal requestedAmount;

    @Column(precision = 14, scale = 2)
    private BigDecimal approvedAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column
    private LocalDate allocationStartDate;

    @Column
    private LocalDate allocationEndDate;

    @Column(length = 800)
    private String guildReviewNote;

    @Column
    private LocalDateTime guildReviewedAt;

    @Column(length = 800)
    private String chiefFinanceReviewNote;

    @Column
    private LocalDateTime chiefFinanceReviewedAt;

    @Column(length = 1600)
    private String communicationMessage;

    @Column
    private LocalDateTime lastPublishedAt;

    @Column(length = 600)
    private String invoiceAttachmentPath;

    public FinanceBudget getBudget() {
        return budget;
    }

    public void setBudget(FinanceBudget budget) {
        this.budget = budget;
    }

    public FinanceFundRequestType getRequestType() {
        return requestType;
    }

    public void setRequestType(FinanceFundRequestType requestType) {
        this.requestType = requestType;
    }

    public FinanceFundRequestStatus getStatus() {
        return status;
    }

    public void setStatus(FinanceFundRequestStatus status) {
        this.status = status;
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

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(BigDecimal requestedAmount) {
        this.requestedAmount = requestedAmount;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public BigDecimal getSpentAmount() {
        return spentAmount;
    }

    public void setSpentAmount(BigDecimal spentAmount) {
        this.spentAmount = spentAmount;
    }

    public LocalDate getAllocationStartDate() {
        return allocationStartDate;
    }

    public void setAllocationStartDate(LocalDate allocationStartDate) {
        this.allocationStartDate = allocationStartDate;
    }

    public LocalDate getAllocationEndDate() {
        return allocationEndDate;
    }

    public void setAllocationEndDate(LocalDate allocationEndDate) {
        this.allocationEndDate = allocationEndDate;
    }

    public String getGuildReviewNote() {
        return guildReviewNote;
    }

    public void setGuildReviewNote(String guildReviewNote) {
        this.guildReviewNote = guildReviewNote;
    }

    public LocalDateTime getGuildReviewedAt() {
        return guildReviewedAt;
    }

    public void setGuildReviewedAt(LocalDateTime guildReviewedAt) {
        this.guildReviewedAt = guildReviewedAt;
    }

    public String getChiefFinanceReviewNote() {
        return chiefFinanceReviewNote;
    }

    public void setChiefFinanceReviewNote(String chiefFinanceReviewNote) {
        this.chiefFinanceReviewNote = chiefFinanceReviewNote;
    }

    public LocalDateTime getChiefFinanceReviewedAt() {
        return chiefFinanceReviewedAt;
    }

    public void setChiefFinanceReviewedAt(LocalDateTime chiefFinanceReviewedAt) {
        this.chiefFinanceReviewedAt = chiefFinanceReviewedAt;
    }

    public String getCommunicationMessage() {
        return communicationMessage;
    }

    public void setCommunicationMessage(String communicationMessage) {
        this.communicationMessage = communicationMessage;
    }

    public LocalDateTime getLastPublishedAt() {
        return lastPublishedAt;
    }

    public void setLastPublishedAt(LocalDateTime lastPublishedAt) {
        this.lastPublishedAt = lastPublishedAt;
    }

    public String getInvoiceAttachmentPath() {
        return invoiceAttachmentPath;
    }

    public void setInvoiceAttachmentPath(String invoiceAttachmentPath) {
        this.invoiceAttachmentPath = invoiceAttachmentPath;
    }
}
