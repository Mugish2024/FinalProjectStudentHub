package aucasa.com.rw.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "finance_communication_updates")
public class FinanceCommunicationUpdate extends BaseEntity {

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 2400)
    private String message;

    @Column(nullable = false, length = 120)
    private String publishedBy;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalCollected;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalApproved;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalSpent;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal remainingBalance;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPublishedBy() {
        return publishedBy;
    }

    public void setPublishedBy(String publishedBy) {
        this.publishedBy = publishedBy;
    }

    public BigDecimal getTotalCollected() {
        return totalCollected;
    }

    public void setTotalCollected(BigDecimal totalCollected) {
        this.totalCollected = totalCollected;
    }

    public BigDecimal getTotalApproved() {
        return totalApproved;
    }

    public void setTotalApproved(BigDecimal totalApproved) {
        this.totalApproved = totalApproved;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(BigDecimal totalSpent) {
        this.totalSpent = totalSpent;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(BigDecimal remainingBalance) {
        this.remainingBalance = remainingBalance;
    }
}
