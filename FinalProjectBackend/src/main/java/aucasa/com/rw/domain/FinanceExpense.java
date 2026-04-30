package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.FinanceExpenseCategory;
import aucasa.com.rw.domain.enums.FinanceExpenseMethod;
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

@Entity
@Table(name = "finance_expenses")
public class FinanceExpense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id")
    private FinanceBudget budget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_request_id")
    private FinanceFundRequest fundRequest;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FinanceExpenseCategory category;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinanceExpenseMethod method;

    @Column(nullable = false, length = 140)
    private String vendor;

    @Column(nullable = false, length = 1200)
    private String description;

    @Column(length = 600)
    private String receiptAttachmentPath;

    public FinanceBudget getBudget() {
        return budget;
    }

    public void setBudget(FinanceBudget budget) {
        this.budget = budget;
    }

    public FinanceFundRequest getFundRequest() {
        return fundRequest;
    }

    public void setFundRequest(FinanceFundRequest fundRequest) {
        this.fundRequest = fundRequest;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public FinanceExpenseCategory getCategory() {
        return category;
    }

    public void setCategory(FinanceExpenseCategory category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public FinanceExpenseMethod getMethod() {
        return method;
    }

    public void setMethod(FinanceExpenseMethod method) {
        this.method = method;
    }

    public String getVendor() {
        return vendor;
    }

    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReceiptAttachmentPath() {
        return receiptAttachmentPath;
    }

    public void setReceiptAttachmentPath(String receiptAttachmentPath) {
        this.receiptAttachmentPath = receiptAttachmentPath;
    }
}
