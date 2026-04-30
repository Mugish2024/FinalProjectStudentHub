package aucasa.com.rw.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FinanceBudgetResponse {
    private Long id;
    private String title;
    private String department;
    private String fiscalYear;
    private BigDecimal assignedAmount;
    private BigDecimal usedAmount;
    private BigDecimal remainingAmount;
    private double utilizationPercentage;
    private String status;
    private String notes;
    private LocalDateTime createdAt;

    public FinanceBudgetResponse(Long id,
                                 String title,
                                 String department,
                                 String fiscalYear,
                                 BigDecimal assignedAmount,
                                 BigDecimal usedAmount,
                                 BigDecimal remainingAmount,
                                 double utilizationPercentage,
                                 String status,
                                 String notes,
                                 LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.fiscalYear = fiscalYear;
        this.assignedAmount = assignedAmount;
        this.usedAmount = usedAmount;
        this.remainingAmount = remainingAmount;
        this.utilizationPercentage = utilizationPercentage;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDepartment() {
        return department;
    }

    public String getFiscalYear() {
        return fiscalYear;
    }

    public BigDecimal getAssignedAmount() {
        return assignedAmount;
    }

    public BigDecimal getUsedAmount() {
        return usedAmount;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public double getUtilizationPercentage() {
        return utilizationPercentage;
    }

    public String getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
