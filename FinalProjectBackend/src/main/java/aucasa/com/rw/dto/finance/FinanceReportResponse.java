package aucasa.com.rw.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class FinanceReportResponse {
    private LocalDate asOfDate;
    private BigDecimal totalAssignedBudget;
    private BigDecimal totalUsedBudget;
    private BigDecimal totalRemainingBudget;
    private IncomeStatement incomeStatement;
    private BalanceSheet balanceSheet;
    private List<BudgetUtilizationItem> budgetUtilization;

    public FinanceReportResponse(LocalDate asOfDate,
                                 BigDecimal totalAssignedBudget,
                                 BigDecimal totalUsedBudget,
                                 BigDecimal totalRemainingBudget,
                                 IncomeStatement incomeStatement,
                                 BalanceSheet balanceSheet,
                                 List<BudgetUtilizationItem> budgetUtilization) {
        this.asOfDate = asOfDate;
        this.totalAssignedBudget = totalAssignedBudget;
        this.totalUsedBudget = totalUsedBudget;
        this.totalRemainingBudget = totalRemainingBudget;
        this.incomeStatement = incomeStatement;
        this.balanceSheet = balanceSheet;
        this.budgetUtilization = budgetUtilization;
    }

    public LocalDate getAsOfDate() {
        return asOfDate;
    }

    public BigDecimal getTotalAssignedBudget() {
        return totalAssignedBudget;
    }

    public BigDecimal getTotalUsedBudget() {
        return totalUsedBudget;
    }

    public BigDecimal getTotalRemainingBudget() {
        return totalRemainingBudget;
    }

    public IncomeStatement getIncomeStatement() {
        return incomeStatement;
    }

    public BalanceSheet getBalanceSheet() {
        return balanceSheet;
    }

    public List<BudgetUtilizationItem> getBudgetUtilization() {
        return budgetUtilization;
    }

    public record IncomeStatement(
            BigDecimal totalRevenue,
            BigDecimal totalExpense,
            BigDecimal netSurplus
    ) {}

    public record BalanceSheet(
            BigDecimal cashAndBank,
            BigDecimal receivables,
            BigDecimal totalAssets,
            BigDecimal liabilities,
            BigDecimal equity
    ) {}

    public record BudgetUtilizationItem(
            Long budgetId,
            String title,
            String department,
            BigDecimal assignedAmount,
            BigDecimal usedAmount,
            BigDecimal remainingAmount,
            double utilizationPercentage,
            String status
    ) {}
}
