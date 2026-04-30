package aucasa.com.rw.service;

import aucasa.com.rw.domain.FinanceBudget;
import aucasa.com.rw.domain.FinanceCommunicationUpdate;
import aucasa.com.rw.domain.FinanceExpense;
import aucasa.com.rw.domain.FinanceFundRequest;
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
import aucasa.com.rw.dto.finance.FinanceBudgetResponse;
import aucasa.com.rw.dto.finance.FinanceFundRequestResponse;
import aucasa.com.rw.dto.finance.FinanceExpenseResponse;
import aucasa.com.rw.dto.finance.FinanceReportResponse;
import aucasa.com.rw.dto.finance.FinanceTransparencyResponse;
import aucasa.com.rw.dto.finance.PublishFinanceUpdateRequest;
import aucasa.com.rw.dto.finance.ReviewFundRequestRequest;
import aucasa.com.rw.repository.FinanceBudgetRepository;
import aucasa.com.rw.repository.FinanceCommunicationUpdateRepository;
import aucasa.com.rw.repository.FinanceExpenseRepository;
import aucasa.com.rw.repository.FinanceFundRequestRepository;
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
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FinanceService {
    private final FinanceBudgetRepository budgetRepository;
    private final FinanceExpenseRepository expenseRepository;
    private final FinanceFundRequestRepository fundRequestRepository;
    private final FinanceCommunicationUpdateRepository communicationUpdateRepository;
    private final PaymentRepository paymentRepository;
    private final String reportPaperPath;
    private final Path financeDocumentUploadDir;

    public FinanceService(FinanceBudgetRepository budgetRepository,
                          FinanceExpenseRepository expenseRepository,
                          FinanceFundRequestRepository fundRequestRepository,
                          FinanceCommunicationUpdateRepository communicationUpdateRepository,
                          PaymentRepository paymentRepository,
                          @Value("${app.finance.report-paper-path:}") String reportPaperPath,
                          @Value("${app.storage.finance-doc-upload-dir:}") String financeDocumentUploadDir) {
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.fundRequestRepository = fundRequestRepository;
        this.communicationUpdateRepository = communicationUpdateRepository;
        this.paymentRepository = paymentRepository;
        this.reportPaperPath = reportPaperPath;
        this.financeDocumentUploadDir = resolveFinanceDocumentDir(financeDocumentUploadDir);
    }

    @Transactional(readOnly = true)
    public List<FinanceBudgetResponse> listBudgets() {
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
    public List<FinanceFundRequestResponse> listFundRequests() {
        return fundRequestRepository.findAll().stream()
                .sorted(Comparator.comparing(FinanceFundRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toFundRequestResponse)
                .toList();
    }

    @Transactional
    public FinanceFundRequestResponse createFundRequest(CreateFundRequestRequest request) {
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

    @Transactional(readOnly = true)
    public FinanceTransparencyResponse getTransparencySummary() {
        EnumSet<PaymentStatus> paidStatuses = EnumSet.of(PaymentStatus.PAID, PaymentStatus.VERIFIED, PaymentStatus.COMPLETED);
        BigDecimal totalCollected = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() != null && paidStatuses.contains(p.getStatus()))
                .map(p -> safeAmount(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FinanceFundRequest> allRequests = fundRequestRepository.findAll();
        BigDecimal totalApproved = allRequests.stream()
                .filter(r -> r.getStatus() == FinanceFundRequestStatus.APPROVED)
                .map(r -> safeAmount(r.getApprovedAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSpent = allRequests.stream()
                .filter(r -> r.getStatus() == FinanceFundRequestStatus.APPROVED)
                .map(r -> safeAmount(r.getSpentAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remaining = totalCollected.subtract(totalSpent);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        int activeApproved = (int) allRequests.stream()
                .filter(r -> r.getStatus() == FinanceFundRequestStatus.APPROVED)
                .filter(r -> safeAmount(r.getApprovedAmount()).compareTo(safeAmount(r.getSpentAmount())) > 0)
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

    @Transactional(readOnly = true)
    public FinanceReportResponse getFinancialReport() {
        return buildFinancialReport();
    }

    @Transactional(readOnly = true)
    public byte[] buildFinancialReportPdf() {
        FinanceReportResponse report = buildFinancialReport();
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        DateTimeFormatter statementDateFmt = DateTimeFormatter.ofPattern("MM/dd/yyyy");
        Font header = new Font(Font.HELVETICA, 14, Font.BOLD);
        Font sub = new Font(Font.HELVETICA, 9, Font.NORMAL);
        Font section = new Font(Font.HELVETICA, 11, Font.BOLD);
        Font body = new Font(Font.HELVETICA, 9, Font.NORMAL);
        byte[] logoImage = loadReportLogo();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20f, 20f, 24f, 20f);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new FinancePdfPageDecorator("Adventist University of Central Africa", "StudentHub System"));
            document.open();

            addReportHeader(document, logoImage, report.getAsOfDate().format(dateFmt), header, sub, section);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("BALANCE SHEET", section));
            document.add(new Paragraph(" "));
            Paragraph bsOwner = new Paragraph("AUCASA FINANCE OFFICE", new Font(Font.HELVETICA, 13, Font.BOLD));
            bsOwner.setAlignment(Element.ALIGN_CENTER);
            document.add(bsOwner);
            Paragraph bsTitle = new Paragraph("Balance Sheet", new Font(Font.HELVETICA, 13, Font.BOLD));
            bsTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(bsTitle);
            Paragraph bsDate = new Paragraph(report.getAsOfDate().format(statementDateFmt), new Font(Font.HELVETICA, 12, Font.BOLD));
            bsDate.setAlignment(Element.ALIGN_CENTER);
            document.add(bsDate);
            document.add(new Paragraph(" "));

            addBalanceSheetSection(document, report);
            document.add(new Paragraph(" "));

            document.newPage();
            addReportHeader(document, logoImage, report.getAsOfDate().format(dateFmt), header, sub, section);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("INCOME STATEMENT", section));
            PdfPTable income = new PdfPTable(2);
            income.setWidthPercentage(62);
            income.setSpacingBefore(6f);
            addCell(income, "Total Revenue (AUCASA fees)", true);
            addCell(income, money(report.getIncomeStatement().totalRevenue()), false);
            addCell(income, "Total Expense (budget utilization)", true);
            addCell(income, money(report.getIncomeStatement().totalExpense()), false);
            addCell(income, "Net Surplus", true);
            addCell(income, money(report.getIncomeStatement().netSurplus()), false);
            document.add(income);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("ASSIGNED BUDGET UTILIZATION", section));
            PdfPTable budgets = new PdfPTable(7);
            budgets.setWidthPercentage(100);
            budgets.setWidths(new float[]{2.2f, 1.3f, 1.2f, 1.2f, 1.2f, 0.9f, 1f});
            addHeaderCell(budgets, "Budget");
            addHeaderCell(budgets, "Department");
            addHeaderCell(budgets, "Assigned");
            addHeaderCell(budgets, "Used");
            addHeaderCell(budgets, "Remaining");
            addHeaderCell(budgets, "Util %");
            addHeaderCell(budgets, "Status");

            for (FinanceReportResponse.BudgetUtilizationItem item : report.getBudgetUtilization()) {
                addBodyCell(budgets, item.title());
                addBodyCell(budgets, item.department());
                addBodyCell(budgets, money(item.assignedAmount()));
                addBodyCell(budgets, money(item.usedAmount()));
                addBodyCell(budgets, money(item.remainingAmount()));
                addBodyCell(budgets, String.format(Locale.ROOT, "%.1f", item.utilizationPercentage()));
                addBodyCell(budgets, item.status());
            }
            if (report.getBudgetUtilization().isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No assigned budget records found.", body));
                empty.setColspan(7);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                empty.setPadding(6f);
                budgets.addCell(empty);
            }
            document.add(budgets);
            document.close();
            return out.toByteArray();
        } catch (IOException | DocumentException ex) {
            throw new IllegalArgumentException("Failed to generate finance statement PDF.");
        }
    }

    private void addReportHeader(Document document,
                                 byte[] logoImage,
                                 String generatedDate,
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
        Paragraph title = new Paragraph("Financial Statement Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        Paragraph generated = new Paragraph("Generated on: " + generatedDate, subFont);
        generated.setAlignment(Element.ALIGN_CENTER);
        centerCell.addElement(uni);
        centerCell.addElement(office);
        centerCell.addElement(title);
        centerCell.addElement(generated);

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
        List<FinanceFundRequest> fundRequests = fundRequestRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        List<FinanceFundRequest> approvedRequests = fundRequests.stream()
                .filter(r -> r.getStatus() == FinanceFundRequestStatus.APPROVED)
                .toList();

        BigDecimal totalAssigned = approvedRequests.stream()
                .map(r -> safeAmount(r.getApprovedAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUsed = approvedRequests.stream()
                .map(r -> safeAmount(r.getSpentAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRemaining = totalAssigned.subtract(totalUsed);

        EnumSet<PaymentStatus> paidStatuses = EnumSet.of(PaymentStatus.PAID, PaymentStatus.VERIFIED, PaymentStatus.COMPLETED);
        BigDecimal revenue = payments.stream()
                .filter(p -> p.getStatus() != null && paidStatuses.contains(p.getStatus()))
                .map(p -> safeAmount(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal receivables = payments.stream()
                .filter(p -> p.getStatus() == null || !paidStatuses.contains(p.getStatus()))
                .map(p -> safeAmount(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expenseTotal = expenses.stream()
                .map(e -> safeAmount(e.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netSurplus = revenue.subtract(expenseTotal);
        BigDecimal liabilities = approvedRequests.stream()
                .map(r -> safeAmount(r.getApprovedAmount()).subtract(safeAmount(r.getSpentAmount())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (liabilities.compareTo(BigDecimal.ZERO) < 0) {
            liabilities = BigDecimal.ZERO;
        }
        BigDecimal cashAndBank = netSurplus.subtract(liabilities).max(BigDecimal.ZERO);
        BigDecimal totalAssets = cashAndBank.add(receivables);
        BigDecimal equity = totalAssets.subtract(liabilities);

        List<FinanceReportResponse.BudgetUtilizationItem> utilization = approvedRequests.stream()
                .sorted(Comparator.comparing(FinanceFundRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(r -> {
                    BigDecimal assigned = safeAmount(r.getApprovedAmount());
                    BigDecimal used = safeAmount(r.getSpentAmount());
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
                new FinanceReportResponse.IncomeStatement(revenue, expenseTotal, netSurplus),
                new FinanceReportResponse.BalanceSheet(cashAndBank, receivables, totalAssets, liabilities, equity),
                utilization
        );
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
        EnumSet<PaymentStatus> paidStatuses = EnumSet.of(PaymentStatus.PAID, PaymentStatus.VERIFIED, PaymentStatus.COMPLETED);
        BigDecimal totalCollected = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() != null && paidStatuses.contains(p.getStatus()))
                .map(p -> safeAmount(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal committedOutstanding = fundRequestRepository.findAll().stream()
                .filter(r -> r.getStatus() == FinanceFundRequestStatus.APPROVED)
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

    private void addCell(PdfPTable table, String text, boolean header) {
        Font font = new Font(Font.HELVETICA, 9, header ? Font.BOLD : Font.NORMAL);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.BOLD)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(4f);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.NORMAL)));
        cell.setPadding(3.5f);
        table.addCell(cell);
    }

    private String money(BigDecimal value) {
        return safeAmount(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
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

    private void addBalanceSheetSection(Document document, FinanceReportResponse report) throws DocumentException {
        Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD | Font.UNDERLINE);
        Font subgroupFont = new Font(Font.HELVETICA, 10, Font.BOLD);
        Font itemFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
        Font totalFont = new Font(Font.HELVETICA, 11, Font.BOLD);

        BigDecimal currentAssets = safeAmount(report.getBalanceSheet().cashAndBank())
                .add(safeAmount(report.getBalanceSheet().receivables()));
        BigDecimal longTermAssets = safeAmount(report.getBalanceSheet().totalAssets()).subtract(currentAssets);
        if (longTermAssets.compareTo(BigDecimal.ZERO) < 0) {
            longTermAssets = BigDecimal.ZERO;
        }
        BigDecimal totalAssets = safeAmount(report.getBalanceSheet().totalAssets());
        BigDecimal currentLiabilities = safeAmount(report.getBalanceSheet().liabilities());
        BigDecimal longTermLiabilities = BigDecimal.ZERO;
        BigDecimal totalLiabilities = currentLiabilities.add(longTermLiabilities);
        BigDecimal totalOwnersEquity = safeAmount(report.getBalanceSheet().equity());
        BigDecimal totalLiabilitiesAndEquity = totalLiabilities.add(totalOwnersEquity);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(72);
        table.setWidths(new float[]{4.6f, 1.6f});
        table.setHorizontalAlignment(Element.ALIGN_CENTER);

        addBalanceHeading(table, "ASSETS", sectionFont);
        addBalanceSubgroup(table, "Current Assets:", subgroupFont);
        addBalanceLineItem(table, "Cash", safeAmount(report.getBalanceSheet().cashAndBank()), itemFont, 1, false);
        addBalanceLineItem(table, "Accounts Receivable", safeAmount(report.getBalanceSheet().receivables()), itemFont, 1, false);
        addBalanceLineItem(table, "Total Current Assets", currentAssets, subgroupFont, 1, true);
        addBalanceSubgroup(table, "Long-Term Assets:", subgroupFont);
        addBalanceLineItem(table, "Assigned Budget Reserve", longTermAssets, itemFont, 1, false);
        addBalanceLineItem(table, "Total Fixed Assets", longTermAssets, subgroupFont, 1, true);
        addBalanceLineItem(table, "TOTAL ASSETS", totalAssets, totalFont, 0, true);

        addBalanceHeading(table, "LIABILITIES", sectionFont);
        addBalanceSubgroup(table, "Current Liabilities:", subgroupFont);
        addBalanceLineItem(table, "Accounts Payable", currentLiabilities, itemFont, 1, false);
        addBalanceLineItem(table, "Total Current Liabilities", currentLiabilities, subgroupFont, 1, true);
        addBalanceSubgroup(table, "Long Term Liabilities:", subgroupFont);
        addBalanceLineItem(table, "Loan", longTermLiabilities, itemFont, 1, false);
        addBalanceLineItem(table, "Total Long Term Liabilities", longTermLiabilities, subgroupFont, 1, true);
        addBalanceLineItem(table, "TOTAL LIABILITIES", totalLiabilities, totalFont, 0, true);

        addBalanceHeading(table, "OWNER'S EQUITY", sectionFont);
        addBalanceLineItem(table, "Retained Earnings", totalOwnersEquity, itemFont, 1, false);
        addBalanceLineItem(table, "TOTAL OWNER'S EQUITY", totalOwnersEquity, totalFont, 0, true);
        addBalanceLineItem(table, "TOTAL LIABILITIES & OWNER'S EQUITY", totalLiabilitiesAndEquity, totalFont, 0, true);

        document.add(table);
    }

    private void addBalanceHeading(PdfPTable table, String text, Font font) {
        PdfPCell label = new PdfPCell(new Phrase(text, font));
        label.setColspan(2);
        label.setBorder(Rectangle.NO_BORDER);
        label.setPaddingTop(6f);
        label.setPaddingBottom(2f);
        table.addCell(label);
    }

    private void addBalanceSubgroup(PdfPTable table, String text, Font font) {
        PdfPCell label = new PdfPCell(new Phrase(text, font));
        label.setColspan(2);
        label.setBorder(Rectangle.NO_BORDER);
        label.setPaddingTop(3f);
        label.setPaddingBottom(2f);
        table.addCell(label);
    }

    private void addBalanceLineItem(PdfPTable table,
                                    String labelText,
                                    BigDecimal amount,
                                    Font labelFont,
                                    int indent,
                                    boolean totalLine) {
        PdfPCell label = new PdfPCell(new Phrase(labelText, labelFont));
        label.setBorder(Rectangle.NO_BORDER);
        label.setPaddingTop(1.5f);
        label.setPaddingBottom(1.5f);
        label.setPaddingLeft(12f + (indent * 14f));
        table.addCell(label);

        PdfPCell value = new PdfPCell(new Phrase(money(amount), labelFont));
        value.setHorizontalAlignment(Element.ALIGN_RIGHT);
        value.setPaddingTop(1.5f);
        value.setPaddingBottom(1.5f);
        value.setPaddingRight(6f);
        if (totalLine) {
            value.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        } else {
            value.setBorder(Rectangle.NO_BORDER);
        }
        table.addCell(value);
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
