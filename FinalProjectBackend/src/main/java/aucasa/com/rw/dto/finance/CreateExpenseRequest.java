package aucasa.com.rw.dto.finance;

public class CreateExpenseRequest {
    private Long budgetId;
    private Long fundRequestId;
    private String expenseDate;
    private String category;
    private String amount;
    private String method;
    private String vendor;
    private String description;
    private String receiptAttachmentPath;

    public Long getBudgetId() {
        return budgetId;
    }

    public void setBudgetId(Long budgetId) {
        this.budgetId = budgetId;
    }

    public Long getFundRequestId() {
        return fundRequestId;
    }

    public void setFundRequestId(Long fundRequestId) {
        this.fundRequestId = fundRequestId;
    }

    public String getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(String expenseDate) {
        this.expenseDate = expenseDate;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
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
