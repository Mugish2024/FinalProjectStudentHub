package aucasa.com.rw.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FinanceIncomeResponse {
    private Long id;
    private LocalDate incomeDate;
    private String source;
    private BigDecimal amount;
    private String method;
    private String description;
    private LocalDateTime createdAt;

    public FinanceIncomeResponse(Long id,
                                 LocalDate incomeDate,
                                 String source,
                                 BigDecimal amount,
                                 String method,
                                 String description,
                                 LocalDateTime createdAt) {
        this.id = id;
        this.incomeDate = incomeDate;
        this.source = source;
        this.amount = amount;
        this.method = method;
        this.description = description;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getIncomeDate() {
        return incomeDate;
    }

    public String getSource() {
        return source;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getMethod() {
        return method;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
