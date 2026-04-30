package aucasa.com.rw.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FinanceExpenseResponse {
    private Long id;
    private Long budgetId;
    private String budgetTitle;
    private Long fundRequestId;
    private String fundRequestTitle;
    private LocalDate expenseDate;
    private String category;
    private BigDecimal amount;
    private String method;
    private String vendor;
    private String description;
    private String receiptAttachmentPath;
    private LocalDateTime createdAt;

    public FinanceExpenseResponse(Long id,
                                  Long budgetId,
                                  String budgetTitle,
                                  Long fundRequestId,
                                  String fundRequestTitle,
                                  LocalDate expenseDate,
                                  String category,
                                  BigDecimal amount,
                                  String method,
                                  String vendor,
                                  String description,
                                  String receiptAttachmentPath,
                                  LocalDateTime createdAt) {
        this.id = id;
        this.budgetId = budgetId;
        this.budgetTitle = budgetTitle;
        this.fundRequestId = fundRequestId;
        this.fundRequestTitle = fundRequestTitle;
        this.expenseDate = expenseDate;
        this.category = category;
        this.amount = amount;
        this.method = method;
        this.vendor = vendor;
        this.description = description;
        this.receiptAttachmentPath = receiptAttachmentPath;
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

    public Long getFundRequestId() {
        return fundRequestId;
    }

    public String getFundRequestTitle() {
        return fundRequestTitle;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public String getCategory() {
        return category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getMethod() {
        return method;
    }

    public String getVendor() {
        return vendor;
    }

    public String getDescription() {
        return description;
    }

    public String getReceiptAttachmentPath() {
        return receiptAttachmentPath;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
