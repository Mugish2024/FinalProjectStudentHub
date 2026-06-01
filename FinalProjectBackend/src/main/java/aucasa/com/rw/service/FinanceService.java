package aucasa.com.rw.service;

import aucasa.com.rw.domain.FinanceBudget;
import aucasa.com.rw.domain.FinanceCommunicationUpdate;
import aucasa.com.rw.domain.FinanceExpense;
import aucasa.com.rw.domain.FinanceFundRequest;
import aucasa.com.rw.domain.FinanceIncome;
import aucasa.com.rw.domain.Payment;
import aucasa.com.rw.domain.enums.FinanceBudgetStatus;
import aucasa.com.rw.domain.enums.FinanceExpenseCategory;
import aucasa.com.rw.domain.enums.FinanceExpenseMethod;
import aucasa.com.rw.domain.enums.FinanceFundRequestStatus;
import aucasa.com.rw.domain.enums.FinanceFundRequestType;
import aucasa.com.rw.domain.enums.PaymentStatus;
import aucasa.com.rw.dto.finance.CreateBudgetRequest;
import aucasa.com.rw.dto.finance.CreateExpenseRequest;
import aucasa.com.rw.dto.finance.CreateFundRequestRequest;
import aucasa.com.rw.dto.finance.CreateIncomeRequest;
import aucasa.com.rw.dto.finance.FinanceBudgetResponse;
import aucasa.com.rw.dto.finance.FinanceFundRequestResponse;
import aucasa.com.rw.dto.finance.FinanceExpenseResponse;
import aucasa.com.rw.dto.finance.FinanceIncomeResponse;
import aucasa.com.rw.dto.finance.FinanceReportResponse;
import aucasa.com.rw.dto.finance.FinanceTransparencyResponse;
import aucasa.com.rw.dto.finance.PublishFinanceUpdateRequest;
import aucasa.com.rw.dto.finance.ReviewFundRequestRequest;
import aucasa.com.rw.repository.FinanceBudgetRepository;
import aucasa.com.rw.repository.FinanceCommunicationUpdateRepository;
import aucasa.com.rw.repository.FinanceExpenseRepository;
import aucasa.com.rw.repository.FinanceFundRequestRepository;
import aucasa.com.rw.repository.FinanceIncomeRepository;
import aucasa.com.rw.repository.PaymentRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfGState;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfTemplate;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FinanceService {
    private static final String OPERATING_BUDGET_TITLE = "AUCASA Collected Fees Operating Budget";
    private static final String OPERATING_DEPARTMENT = "AUCASA Finance";
    private static final String OPERATING_REQUESTED_BY = "System";
    private static final String OPERATING_PURPOSE = "Automatically assigned budget from verified student association money collected.";

    private final FinanceBudgetRepository budgetRepository;
    private final FinanceExpenseRepository expenseRepository;
    private final FinanceFundRequestRepository fundRequestRepository;
    private final FinanceIncomeRepository incomeRepository;
    private final FinanceCommunicationUpdateRepository communicationUpdateRepository;
    private final PaymentRepository paymentRepository;
    private final String reportPaperPath;
    private final Path financeDocumentUploadDir;

    public FinanceService(FinanceBudgetRepository budgetRepository,
                          FinanceExpenseRepository expenseRepository,
                          FinanceFundRequestRepository fundRequestRepository,
                          FinanceIncomeRepository incomeRepository,
                          FinanceCommunicationUpdateRepository communicationUpdateRepository,
                          PaymentRepository paymentRepository,
                          @Value("${app.finance.report-paper-path:}") String reportPaperPath,
                          @Value("${app.storage.finance-doc-upload-dir:}") String financeDocumentUploadDir) {
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.fundRequestRepository = fundRequestRepository;
        this.incomeRepository = incomeRepository;
        this.communicationUpdateRepository = communicationUpdateRepository;
        this.paymentRepository = paymentRepository;
        this.reportPaperPath = reportPaperPath;
        this.financeDocumentUploadDir = resolveFinanceDocumentDir(financeDocumentUploadDir);
    }

    @Transactional
    public List<FinanceBudgetResponse> listBudgets() {
        syncOperatingBudgetFromCollections();
        return budgetRepository.findAll().stream()
                .sorted(Comparator.comparing(FinanceBudget::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toBudgetResponse)
                .toList();
    }

    @Transactional
    public FinanceBudgetResponse createBudget(CreateBudgetRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        String title = trim(request.getTitle());
        String department = trim(request.getDepartment());
        String fiscalYear = trim(request.getFiscalYear());
        String notes = trim(request.getNotes());
        BigDecimal amount = parseAmount(request.getAmount(), "amount");

        if (title.isEmpty() || department.isEmpty() || fiscalYear.isEmpty()) {
            throw new IllegalArgumentException("title, department, fiscalYear, and amount are required.");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Assigned budget amount must be greater than zero.");
        }

        FinanceBudget budget = new FinanceBudget();
        budget.setTitle(title);
        budget.setDepartment(department);
        budget.setFiscalYear(fiscalYear);
        budget.setAssignedAmount(amount);
        budget.setUsedAmount(BigDecimal.ZERO);
        budget.setStatus(FinanceBudgetStatus.PENDING_APPROVAL);
        budget.setNotes(notes.isEmpty() ? null : notes);

        return toBudgetResponse(budgetRepository.save(budget));
    }

    @Transactional
    public FinanceBudgetResponse updateBudgetStatus(Long budgetId, String statusRaw, String actorRoleRaw) {
        if (budgetId == null) {
            throw new IllegalArgumentException("budgetId is required.");
        }
        FinanceBudget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found."));
        FinanceBudgetStatus status = parseBudgetStatus(statusRaw);
        String actorRole = trim(actorRoleRaw).toLowerCase(Locale.ROOT);

        if (status == FinanceBudgetStatus.ACTIVE || status == FinanceBudgetStatus.REJECTED) {
            if (!actorRole.equals("admin")) {
                throw new IllegalArgumentException("Only admin can approve or reject budget envelopes.");
            }
            if (budget.getStatus() != FinanceBudgetStatus.PENDING_APPROVAL) {
                throw new IllegalArgumentException("Only pending budgets can be approved or rejected.");
            }
        }

        if (status == FinanceBudgetStatus.CLOSED) {
            if (!actorRole.equals("admin") && !actorRole.equals("finance")) {
                throw new IllegalArgumentException("Only finance or admin can close a budget.");
            }
            if (budget.getStatus() != FinanceBudgetStatus.ACTIVE) {
                throw new IllegalArgumentException("Only active budgets can be closed.");
            }
        }

        if (status == FinanceBudgetStatus.PENDING_APPROVAL) {
            throw new IllegalArgumentException("Cannot reset budget back to pending approval.");
        }

        budget.setStatus(status);
        return toBudgetResponse(budgetRepository.save(budget));
    }

    @Transactional(readOnly = true)
    public List<FinanceExpenseResponse> listExpenses() {
        return expenseRepository.findAll().stream()
                .sorted(Comparator.comparing(FinanceExpense::getExpenseDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toExpenseResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FinanceIncomeResponse> listIncomes() {
        return incomeRepository.findAll().stream()
                .sorted(Comparator.comparing(FinanceIncome::getIncomeDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(FinanceIncome::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toIncomeResponse)
                .toList();
    }

    @Transactional
    public List<FinanceFundRequestResponse> listFundRequests() {
        syncOperatingBudgetFromCollections();
        return fundRequestRepository.findAll().stream()
                .sorted(Comparator.comparing(FinanceFundRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toFundRequestResponse)
                .toList();
    }

    @Transactional
    public FinanceFundRequestResponse createFundRequest(CreateFundRequestRequest request) {
        syncOperatingBudgetFromCollections();
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        assertRole(request.getActorRole(), "finance", "Only finance can submit fund requests.");

        String title = trim(request.getTitle());
        String department = trim(request.getDepartment());
        String requestedBy = trim(request.getRequestedBy());
        String purpose = trim(request.getPurpose());
        String invoiceAttachmentPath = trim(request.getInvoiceAttachmentPath());
        BigDecimal requestedAmount = parseAmount(request.getRequestedAmount(), "requestedAmount");
        LocalDate startDate = parseDate(request.getAllocationStartDate(), "allocationStartDate");
        LocalDate endDate = parseDate(request.getAllocationEndDate(), "allocationEndDate");
        FinanceFundRequestType requestType = parseFundRequestType(request.getRequestType());

        if (title.isEmpty() || department.isEmpty() || requestedBy.isEmpty() || purpose.isEmpty()) {
            throw new IllegalArgumentException("title, department, requestedBy, and purpose are required.");
        }
        if (requestedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("requestedAmount must be greater than zero.");
        }
        if (invoiceAttachmentPath.isEmpty()) {
            throw new IllegalArgumentException("invoiceAttachmentPath is required. Upload invoice first.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("allocationEndDate cannot be before allocationStartDate.");
        }

        FinanceBudget budget = null;
        if (request.getBudgetId() != null) {
            budget = budgetRepository.findById(request.getBudgetId())
                    .orElseThrow(() -> new IllegalArgumentException("Selected budget was not found."));
            if (budget.getStatus() != FinanceBudgetStatus.ACTIVE) {
                throw new IllegalArgumentException("Fund requests can only target active budgets.");
            }
            BigDecimal budgetRemaining = safeAmount(budget.getAssignedAmount()).subtract(safeAmount(budget.getUsedAmount()));
            if (requestedAmount.compareTo(budgetRemaining) > 0) {
                throw new IllegalArgumentException("Requested amount exceeds remaining budget.");
            }
        } else if (requestType == FinanceFundRequestType.ASSIGNED_BUDGET) {
            throw new IllegalArgumentException("budgetId is required for ASSIGNED_BUDGET requests.");
        }

        FinanceFundRequest fundRequest = new FinanceFundRequest();
        fundRequest.setBudget(budget);
        fundRequest.setRequestType(requestType);
        fundRequest.setStatus(FinanceFundRequestStatus.PENDING_CHIEF_FINANCE_APPROVAL);
        fundRequest.setTitle(title);
        fundRequest.setDepartment(department);
        fundRequest.setRequestedBy(requestedBy);
        fundRequest.setPurpose(purpose);
        fundRequest.setRequestedAmount(requestedAmount);
        fundRequest.setAllocationStartDate(startDate);
        fundRequest.setAllocationEndDate(endDate);
        fundRequest.setSpentAmount(BigDecimal.ZERO);
        fundRequest.setInvoiceAttachmentPath(invoiceAttachmentPath);

        BigDecimal availableCollected = availableCollectedForNewCommitment(null);
        if (requestedAmount.compareTo(availableCollected) > 0) {
            fundRequest.setStatus(FinanceFundRequestStatus.REJECTED);
            fundRequest.setChiefFinanceReviewNote(
                    "Auto-rejected by system: requested amount exceeds currently collected money available."
            );
            fundRequest.setChiefFinanceReviewedAt(LocalDateTime.now());
        }

        return toFundRequestResponse(fundRequestRepository.save(fundRequest));
    }

    @Transactional
    public FinanceFundRequestResponse reviewByGuild(Long requestId, ReviewFundRequestRequest request) {
        if (requestId == null) {
            throw new IllegalArgumentException("requestId is required.");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        assertRole(request.getActorRole(), "guild_president", "Only Guild President can perform this approval.");

        FinanceFundRequest fundRequest = fundRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Fund request not found."));
        if (fundRequest.getStatus() != FinanceFundRequestStatus.PENDING_GUILD_APPROVAL) {
            throw new IllegalArgumentException("This request is not waiting for guild approval.");
        }

        boolean approved = parseDecision(request.getDecision());
        fundRequest.setGuildReviewNote(trim(request.getNote()));
        fundRequest.setGuildReviewedAt(LocalDateTime.now());
        fundRequest.setStatus(approved
                ? FinanceFundRequestStatus.PENDING_CHIEF_FINANCE_APPROVAL
                : FinanceFundRequestStatus.REJECTED);
        return toFundRequestResponse(fundRequestRepository.save(fundRequest));
    }

    @Transactional
    public FinanceFundRequestResponse reviewByChiefFinance(Long requestId, ReviewFundRequestRequest request) {
        syncOperatingBudgetFromCollections();
        if (requestId == null) {
            throw new IllegalArgumentException("requestId is required.");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        assertRole(request.getActorRole(), "admin", "Only Chief Finance (admin) can perform this approval.");

        FinanceFundRequest fundRequest = fundRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Fund request not found."));
        if (fundRequest.getStatus() != FinanceFundRequestStatus.PENDING_CHIEF_FINANCE_APPROVAL) {
            throw new IllegalArgumentException("This request is not waiting for chief finance approval.");
        }

        boolean approved = parseDecision(request.getDecision());
        String reviewNote = trim(request.getNote());
        if (reviewNote.isEmpty()) {
            throw new IllegalArgumentException("Approval/rejection reason is required.");
        }
        fundRequest.setChiefFinanceReviewNote(reviewNote);
        fundRequest.setChiefFinanceReviewedAt(LocalDateTime.now());

        if (!approved) {
            fundRequest.setStatus(FinanceFundRequestStatus.REJECTED);
            return toFundRequestResponse(fundRequestRepository.save(fundRequest));
        }

        BigDecimal approvedAmount = trim(request.getApprovedAmount()).isEmpty()
                ? safeAmount(fundRequest.getRequestedAmount())
                : parseAmount(request.getApprovedAmount(), "approvedAmount");
        if (approvedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("approvedAmount must be greater than zero.");
        }
        if (approvedAmount.compareTo(safeAmount(fundRequest.getRequestedAmount())) > 0) {
            throw new IllegalArgumentException("approvedAmount cannot exceed requestedAmount.");
        }

        FinanceBudget budget = fundRequest.getBudget();
        if (budget != null) {
            BigDecimal available = availableBudgetForNewApproval(budget, fundRequest.getId());
            if (approvedAmount.compareTo(available) > 0) {
                throw new IllegalArgumentException("Approved amount exceeds available budget.");
            }
        }

        BigDecimal availableCollected = availableCollectedForNewCommitment(fundRequest.getId());
        if (approvedAmount.compareTo(availableCollected) > 0) {
            fundRequest.setStatus(FinanceFundRequestStatus.REJECTED);
            fundRequest.setChiefFinanceReviewNote(
                    "Auto-rejected by system: approved amount exceeds collected money available."
            );
            return toFundRequestResponse(fundRequestRepository.save(fundRequest));
        }

        fundRequest.setApprovedAmount(approvedAmount);
        fundRequest.setStatus(FinanceFundRequestStatus.APPROVED);
        String communication = trim(request.getCommunicationMessage());
        if (!communication.isEmpty()) {
            fundRequest.setCommunicationMessage(communication);
            fundRequest.setLastPublishedAt(LocalDateTime.now());
        }
        return toFundRequestResponse(fundRequestRepository.save(fundRequest));
    }

    @Transactional
    public FinanceTransparencyResponse publishUpdate(PublishFinanceUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        assertRole(request.getActorRole(), "finance", "Only finance can publish student updates.");

        String title = trim(request.getTitle());
        String message = trim(request.getMessage());
        String publishedBy = trim(request.getPublishedBy());
        if (title.isEmpty() || message.isEmpty()) {
            throw new IllegalArgumentException("title and message are required.");
        }

        FinanceTransparencyResponse snapshot = getTransparencySummary();
        FinanceCommunicationUpdate update = new FinanceCommunicationUpdate();
        update.setTitle(title);
        update.setMessage(message);
        update.setPublishedBy(publishedBy.isEmpty() ? "Finance Office" : publishedBy);
        update.setTotalCollected(snapshot.getTotalCollected());
        update.setTotalApproved(snapshot.getTotalApproved());
        update.setTotalSpent(snapshot.getTotalSpent());
        update.setRemainingBalance(snapshot.getRemainingBalance());
        communicationUpdateRepository.save(update);

        return getTransparencySummary();
    }

    @Transactional
    public FinanceTransparencyResponse getTransparencySummary() {
        syncOperatingBudgetFromCollections();
        BigDecimal totalCollected = totalCollectedPayments().add(totalEarnedIncome());

        List<FinanceFundRequest> approvedRequests = uniqueApprovedRequests(fundRequestRepository.findAll());
        BigDecimal totalApproved = approvedRequests.stream()
                .map(r -> safeAmount(r.getApprovedAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<FinanceExpense> expenses = expenseRepository.findAll();
        BigDecimal totalSpent = expenses.stream()
                .map(e -> safeAmount(e.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remaining = totalCollected.subtract(totalSpent);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        int activeApproved = (int) approvedRequests.stream()
                .filter(r -> safeAmount(r.getApprovedAmount()).compareTo(reportUsedAmount(r, expenses)) > 0)
                .count();

        List<FinanceTransparencyResponse.TransparencyUpdateItem> updates = communicationUpdateRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(u -> new FinanceTransparencyResponse.TransparencyUpdateItem(
                        u.getId(),
                        u.getTitle(),
                        u.getMessage(),
                        u.getPublishedBy(),
                        u.getCreatedAt(),
                        safeAmount(u.getTotalCollected()),
                        safeAmount(u.getTotalApproved()),
                        safeAmount(u.getTotalSpent()),
                        safeAmount(u.getRemainingBalance())
                ))
                .toList();

        return new FinanceTransparencyResponse(totalCollected, totalApproved, totalSpent, remaining, activeApproved, updates);
    }

    @Transactional
    public FinanceExpenseResponse createExpense(CreateExpenseRequest request) {
        syncOperatingBudgetFromCollections();
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        if (request.getFundRequestId() == null) {
            throw new IllegalArgumentException("fundRequestId is required. Spending must link to an approved request.");
        }

        FinanceFundRequest fundRequest = fundRequestRepository.findById(request.getFundRequestId())
                .orElseThrow(() -> new IllegalArgumentException("Fund request not found."));
        if (fundRequest.getStatus() != FinanceFundRequestStatus.APPROVED) {
            throw new IllegalArgumentException("Expense can only be posted against an approved request.");
        }

        LocalDate expenseDate = parseDate(request.getExpenseDate(), "expenseDate");
        if (fundRequest.getAllocationStartDate() != null && expenseDate.isBefore(fundRequest.getAllocationStartDate())) {
            throw new IllegalArgumentException("Expense date is before the approved allocation period.");
        }
        if (fundRequest.getAllocationEndDate() != null && expenseDate.isAfter(fundRequest.getAllocationEndDate())) {
            throw new IllegalArgumentException("Expense date is after the approved allocation period.");
        }

        FinanceExpenseCategory category = parseCategory(request.getCategory());
        FinanceExpenseMethod method = parseMethod(request.getMethod());
        BigDecimal amount = parseAmount(request.getAmount(), "amount");
        String vendor = trim(request.getVendor());
        String description = trim(request.getDescription());
        String receiptAttachmentPath = trim(request.getReceiptAttachmentPath());

        if (vendor.isEmpty() || description.isEmpty()) {
            throw new IllegalArgumentException("vendor and description are required.");
        }
        if (receiptAttachmentPath.isEmpty()) {
            throw new IllegalArgumentException("receiptAttachmentPath is required. Upload the receipt before posting expense.");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Expense amount must be greater than zero.");
        }

        BigDecimal approved = safeAmount(fundRequest.getApprovedAmount());
        BigDecimal alreadySpent = safeAmount(fundRequest.getSpentAmount());
        BigDecimal approvedRemaining = approved.subtract(alreadySpent);
        if (amount.compareTo(approvedRemaining) > 0) {
            throw new IllegalArgumentException(
                    "Expense exceeds approved request balance. Remaining amount: " + approvedRemaining.setScale(2, RoundingMode.HALF_UP).toPlainString()
            );
        }

        FinanceBudget budget = fundRequest.getBudget();
        BigDecimal used = BigDecimal.ZERO;
        if (budget != null) {
            if (budget.getStatus() != FinanceBudgetStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot post expense to a closed budget.");
            }
            used = safeAmount(budget.getUsedAmount());
            BigDecimal assigned = safeAmount(budget.getAssignedAmount());
            BigDecimal budgetRemaining = assigned.subtract(used);
            if (amount.compareTo(budgetRemaining) > 0) {
                throw new IllegalArgumentException("Expense exceeds remaining assigned budget.");
            }
        }

        FinanceExpense expense = new FinanceExpense();
        expense.setBudget(budget);
        expense.setFundRequest(fundRequest);
        expense.setExpenseDate(expenseDate);
        expense.setCategory(category);
        expense.setAmount(amount);
        expense.setMethod(method);
        expense.setVendor(vendor);
        expense.setDescription(description);
        expense.setReceiptAttachmentPath(receiptAttachmentPath);

        FinanceExpense saved = expenseRepository.save(expense);
        if (budget != null) {
            budget.setUsedAmount(used.add(amount));
            budgetRepository.save(budget);
        }
        fundRequest.setSpentAmount(alreadySpent.add(amount));
        fundRequestRepository.save(fundRequest);

        return toExpenseResponse(saved);
    }

    @Transactional
    public FinanceIncomeResponse createIncome(CreateIncomeRequest request) {
        syncOperatingBudgetFromCollections();
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        LocalDate incomeDate = parseDate(request.getIncomeDate(), "incomeDate");
        BigDecimal amount = parseAmount(request.getAmount(), "amount");
        String source = trim(request.getSource());
        String method = trim(request.getMethod());
        String description = trim(request.getDescription());

        if (source.isEmpty() || method.isEmpty() || description.isEmpty()) {
            throw new IllegalArgumentException("source, method, and description are required.");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Income amount must be greater than zero.");
        }

        FinanceIncome income = new FinanceIncome();
        income.setIncomeDate(incomeDate);
        income.setSource(source);
        income.setAmount(amount);
        income.setMethod(method);
        income.setDescription(description);
        return toIncomeResponse(incomeRepository.save(income));
    }

    @Transactional
    public FinanceReportResponse getFinancialReport() {
        syncOperatingBudgetFromCollections();
        return buildFinancialReport();
    }

    @Transactional
    public byte[] buildFinancialReportPdf() {
        return buildFinancialReportPdf("full");
    }

    @Transactional
    public byte[] buildFinancialReportPdf(String reportTypeRaw) {
        return buildFinancialReportPdf(reportTypeRaw, "monthly");
    }

    @Transactional
    public byte[] buildFinancialReportPdf(String reportTypeRaw, String periodRaw) {
        syncOperatingBudgetFromCollections();
        String reportType = normalizeReportType(reportTypeRaw);
        String period = normalizeStatementPeriod(periodRaw);
        FinanceReportResponse report = buildFinancialReport();
        List<FinanceExpense> expenses = expenseRepository.findAll().stream()
                .filter(expense -> expenseMatchesPeriod(expense, period))
                .sorted(Comparator.comparing(FinanceExpense::getExpenseDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(FinanceExpense::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        List<FinanceIncome> incomes = incomeRepository.findAll().stream()
                .filter(income -> incomeMatchesPeriod(income, period))
                .sorted(Comparator.comparing(FinanceIncome::getIncomeDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(FinanceIncome::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        String periodLabel = statementPeriodLabel(period);
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        Font header = new Font(Font.HELVETICA, 14, Font.BOLD);
        Font sub = new Font(Font.HELVETICA, 9, Font.NORMAL);
        Font section = new Font(Font.HELVETICA, 11, Font.BOLD);
        Font body = new Font(Font.HELVETICA, 9, Font.NORMAL);
        Font note = new Font(Font.HELVETICA, 8, Font.NORMAL);
        byte[] logoImage = loadReportLogo();

        boolean balanceSheetOnly = reportType.equals("balance-sheet");

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = balanceSheetOnly
                    ? new Document(PageSize.A4, 52f, 52f, 48f, 48f)
                    : new Document(PageSize.A4.rotate(), 20f, 20f, 24f, 20f);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            if (!balanceSheetOnly) {
                writer.setPageEvent(new FinancePdfPageDecorator("Adventist University of Central Africa", "StudentHub System"));
            }
            document.open();

            if (!balanceSheetOnly) {
                addReportHeader(document, logoImage, periodLabel, header, sub, section);
                document.add(new Paragraph(" "));
            }

            BigDecimal assignedBudget = safeAmount(report.getTotalAssignedBudget());
            BigDecimal earnedIncome = incomes.stream()
                    .map(income -> safeAmount(income.getAmount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal revenue = totalCollectedPayments().add(earnedIncome);
            BigDecimal totalExpenses = expenses.stream()
                    .map(expense -> safeAmount(expense.getAmount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal netSurplus = revenue.subtract(totalExpenses);
            BigDecimal remainingBalance = assignedBudget.subtract(totalExpenses);
            if (remainingBalance.compareTo(BigDecimal.ZERO) < 0) {
                remainingBalance = BigDecimal.ZERO;
            }
            double totalUtilization = assignedBudget.compareTo(BigDecimal.ZERO) > 0
                    ? totalExpenses.multiply(new BigDecimal("100")).divide(assignedBudget, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            boolean fullReport = reportType.equals("full");
            boolean incomeReport = fullReport || reportType.equals("income-statement");
            boolean balanceReport = fullReport || reportType.equals("balance-sheet");
            boolean cashFlowReport = fullReport || reportType.equals("cash-flow");
            boolean expenseReport = fullReport || reportType.equals("expense-report");

            if (balanceSheetOnly) {
                addBalanceSheetOfficialHeader(document, logoImage, periodLabel);
                addBalanceSheetForm(document, periodLabel, report, netSurplus);
                addFinancialReportNotes(document, assignedBudget, totalExpenses, remainingBalance);
                document.close();
                return out.toByteArray();
            }

            if (incomeReport) {
                document.add(new Paragraph("INCOME STATEMENT", section));
                PdfPTable incomeTable = new PdfPTable(2);
                incomeTable.setWidthPercentage(72);
                incomeTable.setSpacingBefore(6f);
                incomeTable.setSpacingAfter(10f);
                incomeTable.setWidths(new float[]{2.2f, 1.35f});
                addHeaderCell(incomeTable, "Item");
                addHeaderCell(incomeTable, "Amount");
                addBodyCell(incomeTable, "Student Collections");
                addBodyCell(incomeTable, money(totalCollectedPayments()));
                addBodyCell(incomeTable, "Earned Daily Income");
                addBodyCell(incomeTable, money(earnedIncome));
                addBodyCell(incomeTable, "Total Revenue");
                addBodyCell(incomeTable, money(revenue));
                addBodyCell(incomeTable, "Total Expenses");
                addBodyCell(incomeTable, money(totalExpenses));
                addBodyCell(incomeTable, "Net Surplus");
                addBodyCell(incomeTable, money(netSurplus));
            document.add(incomeTable);

                if (!incomes.isEmpty()) {
                    document.add(new Paragraph("EARNED INCOME DETAILS", section));
                    PdfPTable incomeDetails = new PdfPTable(5);
                    incomeDetails.setWidthPercentage(100);
                    incomeDetails.setSpacingBefore(6f);
                    incomeDetails.setSpacingAfter(10f);
                    incomeDetails.setWidths(new float[]{0.95f, 1.7f, 1.15f, 3.0f, 1.15f});
                    addHeaderCell(incomeDetails, "Date");
                    addHeaderCell(incomeDetails, "Source");
                    addHeaderCell(incomeDetails, "Method");
                    addHeaderCell(incomeDetails, "Description");
                    addHeaderCell(incomeDetails, "Amount");
                    for (FinanceIncome income : incomes) {
                        addBodyCell(incomeDetails, income.getIncomeDate() != null ? income.getIncomeDate().toString() : "-");
                        addBodyCell(incomeDetails, nonBlank(income.getSource()));
                        addBodyCell(incomeDetails, nonBlank(income.getMethod()));
                        addBodyCell(incomeDetails, nonBlank(income.getDescription()));
                        addBodyCell(incomeDetails, money(income.getAmount()));
                    }
                    document.add(incomeDetails);
                }
            }

            if (balanceReport) {
                addBalanceSheetForm(document, periodLabel, report, netSurplus);
                addFinancialReportNotes(document, assignedBudget, totalExpenses, remainingBalance);
            }

            if (cashFlowReport) {
                document.add(new Paragraph("STATEMENT OF CASH FLOWS", section));
                PdfPTable cashFlowTable = new PdfPTable(2);
                cashFlowTable.setWidthPercentage(78);
                cashFlowTable.setSpacingBefore(6f);
                cashFlowTable.setSpacingAfter(10f);
                cashFlowTable.setWidths(new float[]{2.4f, 1.35f});
                addHeaderCell(cashFlowTable, "Cash Flow Item");
                addHeaderCell(cashFlowTable, "Amount");
                addBodyCell(cashFlowTable, "Cash received from student collections");
                addBodyCell(cashFlowTable, money(revenue));
                addBodyCell(cashFlowTable, "Cash used for operating expenses");
                addBodyCell(cashFlowTable, money(totalExpenses.negate()));
                addBodyCell(cashFlowTable, "Net cash movement");
                addBodyCell(cashFlowTable, money(netSurplus));
                addBodyCell(cashFlowTable, "Cash balance at period end");
                addBodyCell(cashFlowTable, money(report.getBalanceSheet().cashAndBank()));
                document.add(cashFlowTable);
            }

            if (fullReport) {
            document.add(new Paragraph("BUDGET SUMMARY", section));
            PdfPTable summary = new PdfPTable(4);
            summary.setWidthPercentage(100);
            summary.setSpacingBefore(6f);
            summary.setSpacingAfter(10f);
            summary.setWidths(new float[]{1.6f, 1.6f, 1.6f, 1.4f});
            addHeaderCell(summary, "Total Assigned Budget");
            addHeaderCell(summary, "Total Expenses");
            addHeaderCell(summary, "Remaining Balance");
            addHeaderCell(summary, "Utilization");
            addBodyCell(summary, money(assignedBudget));
            addBodyCell(summary, money(totalExpenses));
            addBodyCell(summary, money(remainingBalance));
            addBodyCell(summary, String.format(Locale.ROOT, "%.1f%%", totalUtilization));
            document.add(summary);
            }

            if (expenseReport) {
            document.add(new Paragraph("EXPENSE BREAKDOWN", section));
            PdfPTable expenseTable = new PdfPTable(5);
            expenseTable.setWidthPercentage(100);
            expenseTable.setSpacingBefore(6f);
            expenseTable.setSpacingAfter(10f);
            expenseTable.setWidths(new float[]{0.95f, 3.4f, 1.35f, 1.7f, 1.15f});
            addHeaderCell(expenseTable, "Date");
            addHeaderCell(expenseTable, "Description");
            addHeaderCell(expenseTable, "Category");
            addHeaderCell(expenseTable, "Receiver/Vendor");
            addHeaderCell(expenseTable, "Amount");
            for (FinanceExpense expense : expenses) {
                addBodyCell(expenseTable, expense.getExpenseDate() != null ? expense.getExpenseDate().toString() : "-");
                addBodyCell(expenseTable, nonBlank(expense.getDescription()));
                addBodyCell(expenseTable, expenseCategoryLabel(expense.getCategory()));
                addBodyCell(expenseTable, nonBlank(expense.getVendor()));
                addBodyCell(expenseTable, money(expense.getAmount()));
            }
            if (expenses.isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No expenses have been recorded for this report.", body));
                empty.setColspan(5);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                empty.setPadding(7f);
                expenseTable.addCell(empty);
            }
            document.add(expenseTable);

            document.add(new Paragraph("EXPENSE CATEGORY SUMMARY", section));
            PdfPTable categoryTable = new PdfPTable(3);
            categoryTable.setWidthPercentage(72);
            categoryTable.setSpacingBefore(6f);
            categoryTable.setSpacingAfter(10f);
            categoryTable.setWidths(new float[]{2.2f, 1.35f, 1.35f});
            addHeaderCell(categoryTable, "Category");
            addHeaderCell(categoryTable, "Amount");
            addHeaderCell(categoryTable, "Total Expenses");
            Map<FinanceExpenseCategory, BigDecimal> categoryTotals = new LinkedHashMap<>();
            for (FinanceExpense expense : expenses) {
                FinanceExpenseCategory category = expense.getCategory();
                categoryTotals.put(category, safeAmount(categoryTotals.get(category)).add(safeAmount(expense.getAmount())));
            }
            for (Map.Entry<FinanceExpenseCategory, BigDecimal> entry : categoryTotals.entrySet()) {
                addBodyCell(categoryTable, expenseCategoryLabel(entry.getKey()));
                addBodyCell(categoryTable, money(entry.getValue()));
                addBodyCell(categoryTable, money(totalExpenses));
            }
            if (categoryTotals.isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No category spending recorded.", body));
                empty.setColspan(3);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                empty.setPadding(7f);
                categoryTable.addCell(empty);
            }
            document.add(categoryTable);
            document.add(new Paragraph(" "));
            }

            if (fullReport) {
            document.add(new Paragraph("BUDGET UTILIZATION", section));
            PdfPTable budgets = new PdfPTable(6);
            budgets.setWidthPercentage(100);
            budgets.setSpacingBefore(6f);
            budgets.setSpacingAfter(10f);
            budgets.setWidths(new float[]{1.7f, 1.35f, 1.35f, 1.35f, 1.0f, 1.0f});
            addHeaderCell(budgets, "Department");
            addHeaderCell(budgets, "Assigned Budget");
            addHeaderCell(budgets, "Used Amount");
            addHeaderCell(budgets, "Remaining Amount");
            addHeaderCell(budgets, "Utilization %");
            addHeaderCell(budgets, "Status");

            for (FinanceReportResponse.BudgetUtilizationItem item : report.getBudgetUtilization()) {
                addBodyCell(budgets, item.department());
                addBodyCell(budgets, money(item.assignedAmount()));
                addBodyCell(budgets, money(item.usedAmount()));
                addBodyCell(budgets, money(item.remainingAmount()));
                addBodyCell(budgets, String.format(Locale.ROOT, "%.1f%%", item.utilizationPercentage()));
                addBodyCell(budgets, item.status());
            }
            if (report.getBudgetUtilization().isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No assigned budget records found.", body));
                empty.setColspan(6);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                empty.setPadding(6f);
                budgets.addCell(empty);
            }
            document.add(budgets);
            }

            document.add(new Paragraph("FINANCIAL NOTES", section));
            PdfPTable notes = new PdfPTable(1);
            notes.setWidthPercentage(100);
            notes.setSpacingBefore(6f);
            addNoteCell(notes, "Budget received: " + money(assignedBudget) + " has been recognized as the assigned AUCASA operating budget for the reporting period.", note);
            addNoteCell(notes, "Expenses used: " + money(totalExpenses) + " has been recorded from approved expense logs and attached usage receipts.", note);
            addNoteCell(notes, "Remaining balance: " + money(remainingBalance) + " is calculated as Assigned Budget minus Total Expenses.", note);
            addNoteCell(notes, "Expense categorization separates spending by purpose, making it easier for auditors and future AUCASA leaders to understand where money was used.", note);
            document.add(notes);

            document.close();
            return out.toByteArray();
        } catch (IOException | DocumentException ex) {
            throw new IllegalArgumentException("Failed to generate finance statement PDF.");
        }
    }

    private void addReportHeader(Document document,
                                 byte[] logoImage,
                                 String periodLabel,
                                 Font titleFont,
                                 Font subFont,
                                 Font uniFont) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{1.0f, 5.0f, 1.0f});
        headerTable.setSpacingAfter(4f);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        if (logoImage != null) {
            try {
                Image logo = Image.getInstance(logoImage);
                logo.scaleToFit(56f, 56f);
                logoCell.addElement(logo);
            } catch (Exception ignored) {
                // Keep the report generation alive without logo if image cannot load.
            }
        }

        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        centerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Paragraph uni = new Paragraph("ADVENTIST UNIVERSITY OF CENTRAL AFRICA", uniFont);
        uni.setAlignment(Element.ALIGN_CENTER);
        Paragraph office = new Paragraph("AUCASA FINANCE OFFICE", new Font(Font.HELVETICA, 10, Font.BOLD));
        office.setAlignment(Element.ALIGN_CENTER);
        Paragraph title = new Paragraph("Budget Utilization & Financial Statement Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        Paragraph period = new Paragraph("AUCASA Finance Office - " + periodLabel, subFont);
        period.setAlignment(Element.ALIGN_CENTER);
        centerCell.addElement(uni);
        centerCell.addElement(office);
        centerCell.addElement(title);
        centerCell.addElement(period);

        PdfPCell rightCell = new PdfPCell(new Phrase(" ", subFont));
        rightCell.setBorder(Rectangle.NO_BORDER);

        headerTable.addCell(logoCell);
        headerTable.addCell(centerCell);
        headerTable.addCell(rightCell);
        document.add(headerTable);

        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell lineCell = new PdfPCell(new Phrase(""));
        lineCell.setBorder(Rectangle.BOTTOM);
        lineCell.setBorderColor(new java.awt.Color(190, 200, 215));
        lineCell.setFixedHeight(6f);
        lineCell.setPadding(0f);
        divider.addCell(lineCell);
        document.add(divider);
    }

    private void addBalanceSheetOfficialHeader(Document document,
                                               byte[] logoImage,
                                               String periodLabel) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(88);
        headerTable.setWidths(new float[]{0.75f, 4.5f, 0.75f});
        headerTable.setSpacingAfter(8f);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        if (logoImage != null) {
            try {
                Image logo = Image.getInstance(logoImage);
                logo.scaleToFit(48f, 48f);
                logoCell.addElement(logo);
            } catch (Exception ignored) {
                // The balance sheet should still download if the logo file is unavailable.
            }
        }

        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph university = new Paragraph("ADVENTIST UNIVERSITY OF CENTRAL AFRICA",
                new Font(Font.HELVETICA, 11, Font.BOLD));
        university.setAlignment(Element.ALIGN_CENTER);
        Paragraph office = new Paragraph("AUCASA Finance Office",
                new Font(Font.HELVETICA, 9, Font.BOLD));
        office.setAlignment(Element.ALIGN_CENTER);
        Paragraph period = new Paragraph(periodLabel,
                new Font(Font.HELVETICA, 8, Font.NORMAL));
        period.setAlignment(Element.ALIGN_CENTER);
        titleCell.addElement(university);
        titleCell.addElement(office);
        titleCell.addElement(period);

        PdfPCell rightCell = new PdfPCell(new Phrase(""));
        rightCell.setBorder(Rectangle.NO_BORDER);

        headerTable.addCell(logoCell);
        headerTable.addCell(titleCell);
        headerTable.addCell(rightCell);
        document.add(headerTable);
    }

    private void addBalanceSheetForm(Document document,
                                     String periodLabel,
                                     FinanceReportResponse report,
                                     BigDecimal netSurplus) throws DocumentException {
        FinanceReportResponse.BalanceSheet sheet = report.getBalanceSheet();
        BigDecimal cash = safeAmount(sheet.cashAndBank());
        BigDecimal receivables = safeAmount(sheet.receivables());
        BigDecimal inventories = BigDecimal.ZERO;
        BigDecimal totalCurrentAssets = cash.add(receivables).add(inventories);
        BigDecimal fixturesAndEquipment = BigDecimal.ZERO;
        BigDecimal truckAndCar = BigDecimal.ZERO;
        BigDecimal lessAccumDepreciation = BigDecimal.ZERO;
        BigDecimal totalPropertyEquipment = fixturesAndEquipment.add(truckAndCar).subtract(lessAccumDepreciation);
        BigDecimal totalAssets = totalCurrentAssets.add(totalPropertyEquipment);

        BigDecimal accountsPayable = safeAmount(sheet.liabilities());
        BigDecimal accruedLiabilities = BigDecimal.ZERO;
        BigDecimal debtDueWithinYear = BigDecimal.ZERO;
        BigDecimal totalCurrentLiabilities = accountsPayable.add(accruedLiabilities).add(debtDueWithinYear);
        BigDecimal longTermDebts = BigDecimal.ZERO;
        BigDecimal totalLiabilities = totalCurrentLiabilities.add(longTermDebts);
        BigDecimal totalEquity = safeAmount(sheet.equity());
        BigDecimal currentEarnings = safeAmount(netSurplus);
        BigDecimal ownerEquity = totalEquity.subtract(currentEarnings);
        BigDecimal totalLiabilitiesAndEquity = totalLiabilities.add(totalEquity);

        Font titleFont = new Font(Font.HELVETICA, 22, Font.NORMAL);
        Font periodFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
        Font sectionFont = new Font(Font.HELVETICA, 10, Font.BOLD);
        Font labelFont = new Font(Font.HELVETICA, 8, Font.NORMAL);
        Font boldLabelFont = new Font(Font.HELVETICA, 8, Font.BOLD);
        Font amountFont = new Font(Font.HELVETICA, 8, Font.NORMAL);
        Font boldAmountFont = new Font(Font.HELVETICA, 8, Font.BOLD);

        PdfPTable outer = new PdfPTable(1);
        outer.setWidthPercentage(88);
        outer.setSpacingBefore(10f);

        PdfPCell outerCell = new PdfPCell();
        outerCell.setBorder(Rectangle.BOX);
        outerCell.setBorderWidth(1f);
        outerCell.setBorderColor(new java.awt.Color(40, 40, 40));
        outerCell.setBackgroundColor(new java.awt.Color(248, 248, 248));
        outerCell.setPaddingTop(24f);
        outerCell.setPaddingRight(72f);
        outerCell.setPaddingBottom(34f);
        outerCell.setPaddingLeft(72f);

        Paragraph title = new Paragraph("BALANCE SHEET", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(5f);
        outerCell.addElement(title);

        Paragraph period = new Paragraph("For the period of: " + periodLabel, periodFont);
        period.setAlignment(Element.ALIGN_CENTER);
        period.setSpacingAfter(16f);
        outerCell.addElement(period);

        PdfPTable form = new PdfPTable(2);
        form.setWidthPercentage(100);
        form.setWidths(new float[]{2.35f, 1f});

        addBalanceSection(form, "ASSETS", sectionFont);
        addBalanceSection(form, "Current Assets:", boldLabelFont);
        addBalanceLine(form, "- Cash", cash, labelFont, amountFont);
        addBalanceLine(form, "- Receivables", receivables, labelFont, amountFont);
        addBalanceLine(form, "- Inventories", inventories, labelFont, amountFont);
        addBalanceSpacer(form, 8f);
        addBalanceLine(form, "Total Current Assets", totalCurrentAssets, boldLabelFont, boldAmountFont);
        addBalanceSpacer(form, 10f);
        addBalanceLine(form, "Property and Equipment", null, labelFont, amountFont);
        addBalanceLine(form, "- Fixtures and Equipments", fixturesAndEquipment, labelFont, amountFont);
        addBalanceLine(form, "- Truck and Car", truckAndCar, labelFont, amountFont);
        addBalanceLine(form, "Less Accum Depreciation", lessAccumDepreciation, labelFont, amountFont);
        addBalanceSpacer(form, 8f);
        addBalanceLine(form, "Total Property and Equipment", totalPropertyEquipment, boldLabelFont, boldAmountFont);
        addBalanceSpacer(form, 10f);
        addBalanceLine(form, "Total Assets", totalAssets, sectionFont, boldAmountFont);
        addBalanceSpacer(form, 12f);

        addBalanceSection(form, "Liabilities and Owner's Equity", sectionFont);
        addBalanceLine(form, "Current Liabilities:", null, labelFont, amountFont);
        addBalanceLine(form, "- Accounts Payable", accountsPayable, labelFont, amountFont);
        addBalanceLine(form, "- Accrued Liabilities", accruedLiabilities, labelFont, amountFont);
        addBalanceLine(form, "- Debt Due within Year", debtDueWithinYear, labelFont, amountFont);
        addBalanceSpacer(form, 8f);
        addBalanceLine(form, "Total Current Liabilities", totalCurrentLiabilities, boldLabelFont, boldAmountFont);
        addBalanceLine(form, "Long Term Debts", longTermDebts, labelFont, amountFont);
        addBalanceLine(form, "Total Liabilities", totalLiabilities, labelFont, amountFont);
        addBalanceSpacer(form, 10f);
        addBalanceLine(form, "Owner's Equity", ownerEquity, labelFont, amountFont);
        addBalanceLine(form, "Current Earnings", currentEarnings, labelFont, amountFont);
        addBalanceSpacer(form, 8f);
        addBalanceLine(form, "Total Equity", totalEquity, boldLabelFont, boldAmountFont);
        addBalanceLine(form, "Total Liabilities and Owner's Equity", totalLiabilitiesAndEquity, sectionFont, boldAmountFont);

        outerCell.addElement(form);
        outer.addCell(outerCell);
        document.add(outer);
    }

    private void addFinancialReportNotes(Document document,
                                         BigDecimal assignedBudget,
                                         BigDecimal totalExpenses,
                                         BigDecimal remainingBalance) throws DocumentException {
        Font noteTitle = new Font(Font.HELVETICA, 10, Font.BOLD);
        Font noteFont = new Font(Font.HELVETICA, 8, Font.NORMAL);

        PdfPTable notes = new PdfPTable(1);
        notes.setWidthPercentage(88);
        notes.setSpacingBefore(10f);

        PdfPCell title = new PdfPCell(new Phrase("FINANCIAL REPORT NOTES", noteTitle));
        title.setBorder(Rectangle.NO_BORDER);
        title.setPaddingBottom(4f);
        notes.addCell(title);

        addNoteCell(notes, "Budget received: " + money(assignedBudget) + " is recognized as the assigned AUCASA operating budget for this reporting period.", noteFont);
        addNoteCell(notes, "Expenses used: " + money(totalExpenses) + " is calculated from approved expense records and uploaded receipts.", noteFont);
        addNoteCell(notes, "Remaining balance: " + money(remainingBalance) + " is calculated as assigned budget minus total expenses.", noteFont);
        addNoteCell(notes, "Balance sheet totals are prepared from verified collections, earned income, liabilities, and recorded spending for the selected period.", noteFont);

        document.add(notes);
    }

    private void addBalanceSection(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(0f);
        cell.setPaddingBottom(2f);
        table.addCell(cell);

        PdfPCell empty = new PdfPCell(new Phrase(""));
        empty.setBorder(Rectangle.NO_BORDER);
        table.addCell(empty);
    }

    private void addBalanceLine(PdfPTable table, String label, BigDecimal amount, Font labelFont, Font amountFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingTop(0f);
        labelCell.setPaddingBottom(1.5f);
        table.addCell(labelCell);

        PdfPCell amountCell = new PdfPCell(new Phrase(amount == null ? "" : money(amount), amountFont));
        amountCell.setBorder(Rectangle.NO_BORDER);
        amountCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        amountCell.setPaddingTop(0f);
        amountCell.setPaddingBottom(1.5f);
        table.addCell(amountCell);
    }

    private void addBalanceSpacer(PdfPTable table, float height) {
        PdfPCell spacer = new PdfPCell(new Phrase(""));
        spacer.setBorder(Rectangle.NO_BORDER);
        spacer.setFixedHeight(height);
        spacer.setColspan(2);
        table.addCell(spacer);
    }

    @Transactional
    public String uploadSupportingDocument(String typeRaw, MultipartFile file) {
        String type = trim(typeRaw).toLowerCase(Locale.ROOT);
        if (type.isEmpty()) {
            throw new IllegalArgumentException("type is required.");
        }
        if (!type.equals("invoice") && !type.equals("receipt")) {
            throw new IllegalArgumentException("type must be invoice or receipt.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file is required.");
        }
        validateFinanceDocument(file);
        try {
            Files.createDirectories(financeDocumentUploadDir);
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = type + "-" + System.currentTimeMillis() + "-" + safeName;
            Path destination = financeDocumentUploadDir.resolve(filename).normalize();
            if (!destination.startsWith(financeDocumentUploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(file.getInputStream(), destination);
            return destination.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store finance document.");
        }
    }

    @Transactional(readOnly = true)
    public FinanceDocumentPayload readSupportingDocument(String storedPathRaw) {
        String storedPath = trim(storedPathRaw);
        if (storedPath.isEmpty()) {
            throw new IllegalArgumentException("path is required.");
        }
        try {
            Path requested = Paths.get(storedPath).toAbsolutePath().normalize();
            if (!requested.startsWith(financeDocumentUploadDir)) {
                throw new IllegalArgumentException("Invalid document path.");
            }
            if (!Files.exists(requested) || !Files.isRegularFile(requested)) {
                throw new IllegalArgumentException("Document not found.");
            }
            byte[] bytes = Files.readAllBytes(requested);
            String filename = requested.getFileName().toString();
            String contentType = Files.probeContentType(requested);
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }
            return new FinanceDocumentPayload(bytes, filename, contentType);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to read document.");
        }
    }

    private byte[] loadReportPaper() {
        List<Path> candidates = List.of(
                trim(reportPaperPath).isEmpty() ? null : Paths.get(reportPaperPath),
                Paths.get("report.png"),
                Paths.get("..", "report.png"),
                Paths.get(System.getProperty("user.dir"), "report.png"),
                Paths.get(System.getProperty("user.dir"), "..", "report.png")
        );
        for (Path candidate : candidates) {
            if (candidate == null) {
                continue;
            }
            try {
                Path normalized = candidate.toAbsolutePath().normalize();
                if (Files.exists(normalized) && Files.isRegularFile(normalized)) {
                    return Files.readAllBytes(normalized);
                }
            } catch (Exception ignored) {
                // Move to next candidate
            }
        }
        return null;
    }

    private FinanceFundRequest syncOperatingBudgetFromCollections() {
        BigDecimal totalCollected = totalCollectedPayments().add(totalEarnedIncome());
        FinanceBudget budget = budgetRepository.findFirstByTitleOrderByIdAsc(OPERATING_BUDGET_TITLE)
                .orElseGet(() -> {
                    FinanceBudget created = new FinanceBudget();
                    created.setTitle(OPERATING_BUDGET_TITLE);
                    created.setDepartment(OPERATING_DEPARTMENT);
                    created.setFiscalYear(String.valueOf(LocalDate.now().getYear()));
                    created.setUsedAmount(BigDecimal.ZERO);
                    created.setStatus(FinanceBudgetStatus.ACTIVE);
                    created.setNotes("System-created from verified student association fee collections.");
                    return created;
                });

        budget.setAssignedAmount(totalCollected);
        budget.setStatus(FinanceBudgetStatus.ACTIVE);

        FinanceFundRequest fundRequest = fundRequestRepository.findFirstByTitleOrderByIdAsc(OPERATING_BUDGET_TITLE)
                .orElseGet(() -> {
                    FinanceFundRequest created = new FinanceFundRequest();
                    created.setTitle(OPERATING_BUDGET_TITLE);
                    created.setRequestType(FinanceFundRequestType.ASSIGNED_BUDGET);
                    created.setDepartment(OPERATING_DEPARTMENT);
                    created.setRequestedBy(OPERATING_REQUESTED_BY);
                    created.setPurpose(OPERATING_PURPOSE);
                    created.setSpentAmount(BigDecimal.ZERO);
                    created.setAllocationStartDate(LocalDate.of(LocalDate.now().getYear(), 1, 1));
                    created.setAllocationEndDate(LocalDate.of(LocalDate.now().getYear(), 12, 31));
                    created.setChiefFinanceReviewNote("System-approved from collected student association money.");
                    created.setChiefFinanceReviewedAt(LocalDateTime.now());
                    return created;
                });

        BigDecimal spent = safeAmount(fundRequest.getSpentAmount());
        budget.setUsedAmount(spent);
        FinanceBudget savedBudget = budgetRepository.save(budget);

        fundRequest.setBudget(savedBudget);
        fundRequest.setStatus(FinanceFundRequestStatus.APPROVED);
        fundRequest.setRequestedAmount(totalCollected);
        fundRequest.setApprovedAmount(totalCollected);
        fundRequest.setPurpose(OPERATING_PURPOSE);
        return fundRequestRepository.save(fundRequest);
    }

    private BigDecimal totalCollectedPayments() {
        EnumSet<PaymentStatus> paidStatuses = EnumSet.of(PaymentStatus.PAID, PaymentStatus.VERIFIED, PaymentStatus.COMPLETED);
        return paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() != null && paidStatuses.contains(p.getStatus()))
                .map(p -> safeAmount(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal totalEarnedIncome() {
        return incomeRepository.findAll().stream()
                .map(income -> safeAmount(income.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private byte[] loadReportLogo() {
        List<Path> candidates = List.of(
                Paths.get("AucaLogo.png"),
                Paths.get("public", "AucaLogo.png"),
                Paths.get("src", "assets", "auca-logo.png"),
                Paths.get(System.getProperty("user.dir"), "AucaLogo.png"),
                Paths.get(System.getProperty("user.dir"), "public", "AucaLogo.png"),
                Paths.get(System.getProperty("user.dir"), "src", "assets", "auca-logo.png")
        );
        for (Path candidate : candidates) {
            if (candidate == null) {
                continue;
            }
            try {
                Path normalized = candidate.toAbsolutePath().normalize();
                if (Files.exists(normalized) && Files.isRegularFile(normalized)) {
                    return Files.readAllBytes(normalized);
                }
            } catch (Exception ignored) {
                // Continue to next candidate.
            }
        }
        return null;
    }

    private FinanceReportResponse buildFinancialReport() {
        List<FinanceExpense> expenses = expenseRepository.findAll();
        List<FinanceIncome> incomes = incomeRepository.findAll();
        List<FinanceFundRequest> fundRequests = fundRequestRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        List<FinanceFundRequest> approvedRequests = uniqueApprovedRequests(fundRequests);

        BigDecimal totalAssigned = approvedRequests.stream()
                .map(r -> safeAmount(r.getApprovedAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expenseTotal = expenses.stream()
                .map(e -> safeAmount(e.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUsed = expenseTotal;
        BigDecimal totalRemaining = totalAssigned.subtract(totalUsed);
        if (totalRemaining.compareTo(BigDecimal.ZERO) < 0) {
            totalRemaining = BigDecimal.ZERO;
        }

        EnumSet<PaymentStatus> paidStatuses = EnumSet.of(PaymentStatus.PAID, PaymentStatus.VERIFIED, PaymentStatus.COMPLETED);
        BigDecimal paymentRevenue = payments.stream()
                .filter(p -> p.getStatus() != null && paidStatuses.contains(p.getStatus()))
                .map(p -> safeAmount(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal earnedIncome = incomes.stream()
                .map(income -> safeAmount(income.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal revenue = paymentRevenue.add(earnedIncome);
        BigDecimal receivables = payments.stream()
                .filter(p -> p.getStatus() == null || !paidStatuses.contains(p.getStatus()))
                .map(p -> safeAmount(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netSurplus = revenue.subtract(expenseTotal);
        BigDecimal liabilities = approvedRequests.stream()
                .map(r -> safeAmount(r.getApprovedAmount()).subtract(reportUsedAmount(r, expenses)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (liabilities.compareTo(BigDecimal.ZERO) < 0) {
            liabilities = BigDecimal.ZERO;
        }
        BigDecimal cashAndBank = netSurplus.max(BigDecimal.ZERO);
        BigDecimal totalAssets = cashAndBank.add(receivables);
        BigDecimal equity = totalAssets.subtract(liabilities);

        List<FinanceReportResponse.BudgetUtilizationItem> utilization = approvedRequests.stream()
                .sorted(Comparator.comparing(FinanceFundRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(r -> {
                    BigDecimal assigned = safeAmount(r.getApprovedAmount());
                    BigDecimal used = reportUsedAmount(r, expenses);
                    BigDecimal remaining = assigned.subtract(used);
                    double percent = assigned.compareTo(BigDecimal.ZERO) > 0
                            ? used.multiply(new BigDecimal("100")).divide(assigned, 1, RoundingMode.HALF_UP).doubleValue()
                            : 0.0;
                    return new FinanceReportResponse.BudgetUtilizationItem(
                            r.getId(),
                            r.getTitle(),
                            r.getDepartment(),
                            assigned,
                            used,
                            remaining,
                            percent,
                            r.getStatus() != null ? r.getStatus().name().toLowerCase(Locale.ROOT) : "approved"
                    );
                })
                .toList();

        return new FinanceReportResponse(
                LocalDate.now(),
                totalAssigned,
                totalUsed,
                totalRemaining,
                new FinanceReportResponse.IncomeStatement(revenue, earnedIncome, expenseTotal, netSurplus),
                new FinanceReportResponse.BalanceSheet(cashAndBank, receivables, totalAssets, liabilities, equity),
                utilization
        );
    }

    private List<FinanceFundRequest> uniqueApprovedRequests(List<FinanceFundRequest> requests) {
        List<FinanceFundRequest> approved = new ArrayList<>();
        boolean operatingBudgetIncluded = false;
        for (FinanceFundRequest request : requests) {
            if (request.getStatus() != FinanceFundRequestStatus.APPROVED) {
                continue;
            }
            if (OPERATING_BUDGET_TITLE.equals(request.getTitle())) {
                if (operatingBudgetIncluded) {
                    continue;
                }
                operatingBudgetIncluded = true;
            }
            approved.add(request);
        }
        return approved;
    }

    private BigDecimal reportUsedAmount(FinanceFundRequest request, List<FinanceExpense> expenses) {
        if (request == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal used = expenses.stream()
                .filter(expense -> {
                    FinanceFundRequest expenseRequest = expense.getFundRequest();
                    if (expenseRequest == null) {
                        return false;
                    }
                    if (OPERATING_BUDGET_TITLE.equals(request.getTitle())) {
                        return OPERATING_BUDGET_TITLE.equals(expenseRequest.getTitle());
                    }
                    return request.getId() != null && request.getId().equals(expenseRequest.getId());
                })
                .map(expense -> safeAmount(expense.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (used.compareTo(BigDecimal.ZERO) > 0) {
            return used;
        }
        return safeAmount(request.getSpentAmount());
    }

    private FinanceBudgetResponse toBudgetResponse(FinanceBudget budget) {
        BigDecimal assigned = safeAmount(budget.getAssignedAmount());
        BigDecimal used = safeAmount(budget.getUsedAmount());
        BigDecimal remaining = assigned.subtract(used);
        double utilization = assigned.compareTo(BigDecimal.ZERO) > 0
                ? used.multiply(new BigDecimal("100")).divide(assigned, 1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;
        return new FinanceBudgetResponse(
                budget.getId(),
                budget.getTitle(),
                budget.getDepartment(),
                budget.getFiscalYear(),
                assigned,
                used,
                remaining,
                utilization,
                budget.getStatus() != null ? budget.getStatus().name().toLowerCase(Locale.ROOT) : "active",
                budget.getNotes(),
                budget.getCreatedAt()
        );
    }

    private FinanceFundRequestResponse toFundRequestResponse(FinanceFundRequest request) {
        FinanceBudget budget = request.getBudget();
        BigDecimal approved = safeAmount(request.getApprovedAmount());
        BigDecimal spent = safeAmount(request.getSpentAmount());
        BigDecimal remaining = approved.subtract(spent);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }
        return new FinanceFundRequestResponse(
                request.getId(),
                budget != null ? budget.getId() : null,
                budget != null ? budget.getTitle() : null,
                request.getRequestType() != null ? request.getRequestType().name().toLowerCase(Locale.ROOT) : "",
                request.getStatus() != null ? request.getStatus().name().toLowerCase(Locale.ROOT) : "",
                request.getTitle(),
                request.getDepartment(),
                request.getRequestedBy(),
                request.getPurpose(),
                safeAmount(request.getRequestedAmount()),
                approved,
                spent,
                remaining,
                request.getAllocationStartDate(),
                request.getAllocationEndDate(),
                request.getGuildReviewNote(),
                request.getGuildReviewedAt(),
                request.getChiefFinanceReviewNote(),
                request.getChiefFinanceReviewedAt(),
                request.getCommunicationMessage(),
                request.getInvoiceAttachmentPath(),
                request.getLastPublishedAt(),
                request.getCreatedAt()
        );
    }

    private FinanceExpenseResponse toExpenseResponse(FinanceExpense expense) {
        FinanceBudget budget = expense.getBudget();
        FinanceFundRequest fundRequest = expense.getFundRequest();
        return new FinanceExpenseResponse(
                expense.getId(),
                budget != null ? budget.getId() : null,
                budget != null ? budget.getTitle() : null,
                fundRequest != null ? fundRequest.getId() : null,
                fundRequest != null ? fundRequest.getTitle() : null,
                expense.getExpenseDate(),
                expense.getCategory() != null ? expense.getCategory().name().toLowerCase(Locale.ROOT) : "",
                safeAmount(expense.getAmount()),
                expense.getMethod() != null ? expense.getMethod().name().toLowerCase(Locale.ROOT) : "",
                expense.getVendor(),
                expense.getDescription(),
                expense.getReceiptAttachmentPath(),
                expense.getCreatedAt()
        );
    }

    private FinanceIncomeResponse toIncomeResponse(FinanceIncome income) {
        return new FinanceIncomeResponse(
                income.getId(),
                income.getIncomeDate(),
                income.getSource(),
                safeAmount(income.getAmount()),
                income.getMethod(),
                income.getDescription(),
                income.getCreatedAt()
        );
    }

    private FinanceBudgetStatus parseBudgetStatus(String raw) {
        String value = trim(raw).toUpperCase(Locale.ROOT);
        if (value.isEmpty()) {
            throw new IllegalArgumentException("status is required.");
        }
        try {
            return FinanceBudgetStatus.valueOf(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unsupported budget status.");
        }
    }

    private FinanceFundRequestType parseFundRequestType(String raw) {
        String value = trim(raw).toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        if (value.isEmpty()) {
            throw new IllegalArgumentException("requestType is required.");
        }
        try {
            return FinanceFundRequestType.valueOf(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unsupported requestType.");
        }
    }

    private boolean parseDecision(String raw) {
        String value = trim(raw).toUpperCase(Locale.ROOT);
        if (!value.equals("APPROVE") && !value.equals("REJECT")) {
            throw new IllegalArgumentException("decision must be APPROVE or REJECT.");
        }
        return value.equals("APPROVE");
    }

    private void assertRole(String actorRole, String requiredRole, String errorMessage) {
        String normalized = trim(actorRole).toLowerCase(Locale.ROOT);
        if (!normalized.equals(requiredRole)) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private BigDecimal availableBudgetForNewApproval(FinanceBudget budget, Long currentRequestId) {
        BigDecimal assigned = safeAmount(budget.getAssignedAmount());
        BigDecimal used = safeAmount(budget.getUsedAmount());
        BigDecimal reservedOutstanding = fundRequestRepository.findByBudgetId(budget.getId()).stream()
                .filter(r -> r.getStatus() == FinanceFundRequestStatus.APPROVED)
                .filter(r -> currentRequestId == null || !currentRequestId.equals(r.getId()))
                .map(r -> safeAmount(r.getApprovedAmount()).subtract(safeAmount(r.getSpentAmount())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (reservedOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            reservedOutstanding = BigDecimal.ZERO;
        }
        BigDecimal available = assigned.subtract(used).subtract(reservedOutstanding);
        if (available.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        return available;
    }

    private BigDecimal availableCollectedForNewCommitment(Long currentRequestId) {
        BigDecimal totalCollected = totalCollectedPayments().add(totalEarnedIncome());

        BigDecimal committedOutstanding = fundRequestRepository.findAll().stream()
                .filter(r -> r.getStatus() == FinanceFundRequestStatus.APPROVED)
                .filter(r -> !OPERATING_BUDGET_TITLE.equals(r.getTitle()))
                .filter(r -> currentRequestId == null || !currentRequestId.equals(r.getId()))
                .map(r -> safeAmount(r.getApprovedAmount()).subtract(safeAmount(r.getSpentAmount())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (committedOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            committedOutstanding = BigDecimal.ZERO;
        }

        BigDecimal available = totalCollected.subtract(committedOutstanding);
        return available.max(BigDecimal.ZERO);
    }

    private FinanceExpenseCategory parseCategory(String raw) {
        String value = trim(raw).toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        if (value.isEmpty()) {
            throw new IllegalArgumentException("category is required.");
        }
        try {
            return FinanceExpenseCategory.valueOf(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unsupported expense category.");
        }
    }

    private FinanceExpenseMethod parseMethod(String raw) {
        String value = trim(raw).toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        if (value.isEmpty()) {
            throw new IllegalArgumentException("method is required.");
        }
        try {
            return FinanceExpenseMethod.valueOf(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Unsupported expense method.");
        }
    }

    private LocalDate parseDate(String raw, String fieldName) {
        String value = trim(raw);
        if (value.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid date for " + fieldName + ".");
        }
    }

    private BigDecimal parseAmount(String raw, String fieldName) {
        String value = trim(raw);
        if (value.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        try {
            return new BigDecimal(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid numeric value for " + fieldName + ".");
        }
    }

    private BigDecimal safeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeReportType(String value) {
        String normalized = trim(value).toLowerCase(Locale.ROOT).replace('_', '-').replace(' ', '-');
        if (normalized.isEmpty()) {
            return "full";
        }
        return switch (normalized) {
            case "income-statement", "balance-sheet", "cash-flow", "expense-report", "full" -> normalized;
            default -> throw new IllegalArgumentException("Unsupported finance report type.");
        };
    }

    private String normalizeStatementPeriod(String value) {
        String normalized = trim(value).toLowerCase(Locale.ROOT).replace('_', '-').replace(' ', '-');
        if (normalized.isEmpty()) {
            return "monthly";
        }
        return switch (normalized) {
            case "daily", "monthly", "quarterly", "annual" -> normalized;
            case "yearly" -> "annual";
            case "quarter" -> "quarterly";
            default -> throw new IllegalArgumentException("Unsupported statement period.");
        };
    }

    private boolean expenseMatchesPeriod(FinanceExpense expense, String period) {
        if (expense == null || expense.getExpenseDate() == null) {
            return false;
        }
        LocalDate date = expense.getExpenseDate();
        LocalDate now = LocalDate.now();
        return switch (period) {
            case "daily" -> date.equals(now);
            case "monthly" -> date.getYear() == now.getYear() && date.getMonthValue() == now.getMonthValue();
            case "quarterly" -> date.getYear() == now.getYear() && ((date.getMonthValue() - 1) / 3) == ((now.getMonthValue() - 1) / 3);
            case "annual" -> date.getYear() == now.getYear();
            default -> true;
        };
    }

    private boolean incomeMatchesPeriod(FinanceIncome income, String period) {
        if (income == null || income.getIncomeDate() == null) {
            return false;
        }
        LocalDate date = income.getIncomeDate();
        LocalDate now = LocalDate.now();
        return switch (period) {
            case "daily" -> date.equals(now);
            case "monthly" -> date.getYear() == now.getYear() && date.getMonthValue() == now.getMonthValue();
            case "quarterly" -> date.getYear() == now.getYear() && ((date.getMonthValue() - 1) / 3) == ((now.getMonthValue() - 1) / 3);
            case "annual" -> date.getYear() == now.getYear();
            default -> true;
        };
    }

    private String statementPeriodLabel(String period) {
        LocalDate now = LocalDate.now();
        return switch (period) {
            case "daily" -> "Daily - " + now.format(DateTimeFormatter.ISO_LOCAL_DATE);
            case "monthly" -> "Monthly - " + now.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
            case "quarterly" -> "Quarter " + (((now.getMonthValue() - 1) / 3) + 1) + " - " + now.getYear();
            case "annual" -> "Annual - " + now.getYear();
            default -> "Monthly - " + now.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
        };
    }

    private void addCell(PdfPTable table, String text, boolean header) {
        Font font = new Font(Font.HELVETICA, 9, header ? Font.BOLD : Font.NORMAL);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.BOLD, java.awt.Color.WHITE)));
        cell.setBackgroundColor(new java.awt.Color(15, 47, 102));
        cell.setBorderColor(new java.awt.Color(180, 190, 205));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.NORMAL)));
        cell.setBorderColor(new java.awt.Color(210, 218, 230));
        cell.setPadding(4.5f);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        if (looksLikeAmount(text) || text.endsWith("%")) {
            cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        }
        table.addCell(cell);
    }

    private void addNoteCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new java.awt.Color(248, 250, 252));
        cell.setBorderColor(new java.awt.Color(210, 218, 230));
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private String money(BigDecimal value) {
        return safeAmount(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private boolean looksLikeAmount(String value) {
        return value != null && value.matches("-?\\d+(\\.\\d{2})?");
    }

    private String expenseCategoryLabel(FinanceExpenseCategory category) {
        if (category == null) {
            return "-";
        }
        String value = category.name().toLowerCase(Locale.ROOT).replace('_', ' ');
        String[] words = value.split(" ");
        StringBuilder label = new StringBuilder();
        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            if (!label.isEmpty()) {
                label.append(' ');
            }
            label.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return label.toString();
    }

    private String nonBlank(String value) {
        String trimmed = trim(value);
        return trimmed.isEmpty() ? "-" : trimmed;
    }

    private void validateFinanceDocument(MultipartFile file) {
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        boolean pdf = contentType.equals("application/pdf") || name.endsWith(".pdf");
        boolean image = contentType.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
        if (!pdf && !image) {
            throw new IllegalArgumentException("Document must be PDF, JPG, or PNG.");
        }
    }

    private Path resolveFinanceDocumentDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "finance-docs").toAbsolutePath().normalize();
    }

    private static class ReportPaperBackground extends PdfPageEventHelper {
        private final byte[] imageData;

        private ReportPaperBackground(byte[] imageData) {
            this.imageData = imageData;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                Image background = Image.getInstance(imageData);
                background.scaleAbsolute(document.getPageSize().getWidth(), document.getPageSize().getHeight());
                background.setAbsolutePosition(0, 0);
                PdfContentByte under = writer.getDirectContentUnder();
                under.addImage(background);
            } catch (Exception ignored) {
                // If background fails, keep PDF generation alive.
            }
        }
    }

    private static class FinancePdfPageDecorator extends PdfPageEventHelper {
        private final String organization;
        private final String systemName;
        private PdfTemplate totalTemplate;

        private FinancePdfPageDecorator(String organization, String systemName) {
            this.organization = organization;
            this.systemName = systemName;
        }

        @Override
        public void onOpenDocument(PdfWriter writer, Document document) {
            totalTemplate = writer.getDirectContent().createTemplate(40, 14);
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Rectangle page = document.getPageSize();
            float footerY = page.getBottom(18);

            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                    new Phrase("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                            new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    page.getLeft(24), footerY, 0);

            String pageText = "Page " + writer.getPageNumber() + " of ";
            float centerX = page.getWidth() / 2f;
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                    new Phrase(pageText, new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    centerX, footerY, 0);
            cb.addTemplate(totalTemplate, centerX + 16, footerY - 2);

            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                    new Phrase(organization + " | " + systemName, new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    page.getRight(24), footerY, 0);

            PdfGState gState = new PdfGState();
            gState.setFillOpacity(0.08f);
            cb.saveState();
            cb.setGState(gState);
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                    new Phrase("AUCA FINANCIAL REPORT", new Font(Font.HELVETICA, 42, Font.BOLD, new java.awt.Color(44, 62, 80))),
                    page.getWidth() / 2f, page.getHeight() / 2f, 45);
            cb.restoreState();
        }

        @Override
        public void onCloseDocument(PdfWriter writer, Document document) {
            ColumnText.showTextAligned(totalTemplate, Element.ALIGN_LEFT,
                    new Phrase(String.valueOf(writer.getPageNumber() - 1), new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    0, 0, 0);
        }
    }

    public static class FinanceDocumentPayload {
        private final byte[] bytes;
        private final String filename;
        private final String contentType;

        public FinanceDocumentPayload(byte[] bytes, String filename, String contentType) {
            this.bytes = bytes;
            this.filename = filename;
            this.contentType = contentType;
        }

        public byte[] getBytes() {
            return bytes;
        }

        public String getFilename() {
            return filename;
        }

        public String getContentType() {
            return contentType;
        }
    }
}
