package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.FinanceBudgetStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "finance_budgets")
public class FinanceBudget extends BaseEntity {

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 120)
    private String department;

    @Column(nullable = false, length = 40)
    private String fiscalYear;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal assignedAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal usedAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinanceBudgetStatus status = FinanceBudgetStatus.PENDING_APPROVAL;

    @Column(length = 1000)
    private String notes;

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

    public String getFiscalYear() {
        return fiscalYear;
    }

    public void setFiscalYear(String fiscalYear) {
        this.fiscalYear = fiscalYear;
    }

    public BigDecimal getAssignedAmount() {
        return assignedAmount;
    }

    public void setAssignedAmount(BigDecimal assignedAmount) {
        this.assignedAmount = assignedAmount;
    }

    public BigDecimal getUsedAmount() {
        return usedAmount;
    }

    public void setUsedAmount(BigDecimal usedAmount) {
        this.usedAmount = usedAmount;
    }

    public FinanceBudgetStatus getStatus() {
        return status;
    }

    public void setStatus(FinanceBudgetStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
