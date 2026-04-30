package aucasa.com.rw.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class FinanceTransparencyResponse {
    private BigDecimal totalCollected;
    private BigDecimal totalApproved;
    private BigDecimal totalSpent;
    private BigDecimal remainingBalance;
    private int activeApprovedRequests;
    private List<TransparencyUpdateItem> latestUpdates;

    public FinanceTransparencyResponse(BigDecimal totalCollected,
                                       BigDecimal totalApproved,
                                       BigDecimal totalSpent,
                                       BigDecimal remainingBalance,
                                       int activeApprovedRequests,
                                       List<TransparencyUpdateItem> latestUpdates) {
        this.totalCollected = totalCollected;
        this.totalApproved = totalApproved;
        this.totalSpent = totalSpent;
        this.remainingBalance = remainingBalance;
        this.activeApprovedRequests = activeApprovedRequests;
        this.latestUpdates = latestUpdates;
    }

    public BigDecimal getTotalCollected() {
        return totalCollected;
    }

    public BigDecimal getTotalApproved() {
        return totalApproved;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public int getActiveApprovedRequests() {
        return activeApprovedRequests;
    }

    public List<TransparencyUpdateItem> getLatestUpdates() {
        return latestUpdates;
    }

    public record TransparencyUpdateItem(
            Long id,
            String title,
            String message,
            String publishedBy,
            LocalDateTime createdAt,
            BigDecimal totalCollected,
            BigDecimal totalApproved,
            BigDecimal totalSpent,
            BigDecimal remainingBalance
    ) {}
}
