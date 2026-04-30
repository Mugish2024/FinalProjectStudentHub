package aucasa.com.rw.service;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.Payment;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.PaymentMethod;
import aucasa.com.rw.domain.enums.PaymentReceiptStatus;
import aucasa.com.rw.domain.enums.PaymentStatus;
import aucasa.com.rw.dto.payment.PaymentGateResponse;
import aucasa.com.rw.dto.payment.PaymentReportResponse;
import aucasa.com.rw.dto.payment.TransactionImportResponse;
import aucasa.com.rw.dto.payment.UnpaidStudentItem;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.PaymentRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import aucasa.com.rw.service.mobilemoney.MobileMoneyPushResult;
import aucasa.com.rw.service.mobilemoney.MobileMoneyService;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

@Service
public class PaymentService {
    private static final BigDecimal MANDATORY_FEE_AMOUNT = new BigDecimal("3000.00");
    private static final String CURRENCY = "RWF";

    private final PaymentRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final AcademicTermRepository academicTermRepository;
    private final UserAccountRepository userAccountRepository;
    private final MobileMoneyService mobileMoneyService;
    private final PaymentTransactionService transactionService;
    private final Path receiptUploadDir;
    private final String urubutoVerifyUrl;
    private final boolean urubutoSimulate;

    public PaymentService(
            PaymentRepository repository,
            StudentProfileRepository studentProfileRepository,
            AcademicTermRepository academicTermRepository,
            UserAccountRepository userAccountRepository,
            MobileMoneyService mobileMoneyService,
            PaymentTransactionService transactionService,
            @Value("${app.storage.receipt-upload-dir:}") String receiptUploadDir,
            @Value("${app.payment.urubuto.verify-url:}") String urubutoVerifyUrl,
            @Value("${app.payment.urubuto.simulate:true}") boolean urubutoSimulate
    ) {
        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.academicTermRepository = academicTermRepository;
        this.userAccountRepository = userAccountRepository;
        this.mobileMoneyService = mobileMoneyService;
        this.transactionService = transactionService;
        this.receiptUploadDir = resolveReceiptDir(receiptUploadDir);
        this.urubutoVerifyUrl = urubutoVerifyUrl;
        this.urubutoSimulate = urubutoSimulate;
    }

    public List<Payment> findAll() { return repository.findAll(); }
    public Optional<Payment> findById(Long id) { return repository.findById(id); }
    public Payment create(Payment entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }

    @Transactional
    public Payment createMandatoryObligation(Long studentId, Long termId) {
        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + studentId));
        AcademicTerm term = resolveTerm(termId);

        Optional<Payment> existing = repository.findByStudentIdAndTermId(studentId, term.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        Payment payment = new Payment();
        payment.setStudent(student);
        payment.setTerm(term);
        payment.setAmount(MANDATORY_FEE_AMOUNT);
        payment.setCurrency(CURRENCY);
        payment.setMethod(PaymentMethod.MOBILE_MONEY);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setReceiptNumber(generateReceiptNumber(studentId, term.getId()));
        return repository.save(payment);
    }

    @Transactional
    public int createMandatoryObligationsForTerm(Long termId) {
        AcademicTerm term = resolveTerm(termId);
        List<StudentProfile> students = studentProfileRepository.findAll();
        int created = 0;
        for (StudentProfile student : students) {
            boolean exists = repository.existsByStudentIdAndTermId(student.getId(), term.getId());
            if (!exists) {
                Payment payment = new Payment();
                payment.setStudent(student);
                payment.setTerm(term);
                payment.setAmount(MANDATORY_FEE_AMOUNT);
                payment.setCurrency(CURRENCY);
                payment.setMethod(PaymentMethod.MOBILE_MONEY);
                payment.setStatus(PaymentStatus.PENDING);
                payment.setReceiptNumber(generateReceiptNumber(student.getId(), term.getId()));
                repository.save(payment);
                created++;
            }
        }
        return created;
    }

    @Transactional
    public Payment submitPayment(Long paymentId, PaymentMethod method, String phoneNumber, String externalReference) {
        if (method == null) {
            throw new IllegalArgumentException("Payment method is required.");
        }

        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        payment.setMethod(method);

        if (method == PaymentMethod.MOBILE_MONEY) {
            if (phoneNumber == null || phoneNumber.isBlank()) {
                throw new IllegalArgumentException("phoneNumber is required for mobile money.");
            }

            MobileMoneyPushResult push = mobileMoneyService.initiatePush(
                    phoneNumber,
                    payment.getAmount(),
                    payment.getReceiptNumber()
            );

            if (!push.isInitiated()) {
                throw new IllegalArgumentException(push.getMessage());
            }

            payment.setPayerPhoneNumber(phoneNumber);
            payment.setExternalReference(push.getProviderReference());
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaidAt(null);
            return repository.save(payment);
        }

        payment.setExternalReference(externalReference);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        return repository.save(payment);
    }

    @Transactional
    public Payment handleMobileMoneyCallback(String receiptNumber, String providerReference, boolean success) {
        if (receiptNumber == null || receiptNumber.isBlank()) {
            throw new IllegalArgumentException("receiptNumber is required.");
        }

        Payment payment = repository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for receiptNumber: " + receiptNumber));

        payment.setExternalReference(providerReference);
        if (success) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }
        return repository.save(payment);
    }

    @Transactional
    public Payment verifyPayment(Long paymentId, Long verifiedByUserId) {
        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        if (payment.getStatus() != PaymentStatus.COMPLETED
                && payment.getStatus() != PaymentStatus.VERIFIED
                && payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("Only completed payments can be verified.");
        }

        if (verifiedByUserId != null) {
            UserAccount verifier = userAccountRepository.findById(verifiedByUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Verifier user not found: " + verifiedByUserId));
            payment.setVerifiedBy(verifier);
        }

        payment.setStatus(PaymentStatus.VERIFIED);
        if (payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }
        return repository.save(payment);
    }

    @Transactional
    public Payment uploadReceipt(Long paymentId, LocalDate paidDate, LocalDate validUntil, MultipartFile receiptFile) {
        if (paidDate == null || validUntil == null) {
            throw new IllegalArgumentException("paidDate and validUntil are required.");
        }
        if (receiptFile == null || receiptFile.isEmpty()) {
            throw new IllegalArgumentException("Receipt file is required.");
        }
        if (validUntil.isBefore(paidDate)) {
            throw new IllegalArgumentException("validUntil cannot be before paidDate.");
        }

        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        payment.setReceiptIssuedAt(paidDate.atStartOfDay());
        payment.setReceiptValidUntil(validUntil.atStartOfDay());
        payment.setReceiptFilePath(storeReceipt(receiptFile));

        boolean expired = validUntil.isBefore(LocalDate.now());
        payment.setReceiptStatus(expired ? PaymentReceiptStatus.EXPIRED : PaymentReceiptStatus.VALID);

        if (!expired) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(paidDate.atStartOfDay());
        }

        return repository.save(payment);
    }

    @Transactional
    public Payment submitUrubutoReceipt(Long paymentId,
                                        PaymentMethod method,
                                        String phoneNumber,
                                        String transactionId,
                                        BigDecimal amount,
                                        LocalDate paidDate,
                                        String ocrName,
                                        String ocrTransactionId,
                                        String ocrPhoneNumber,
                                        String ocrAmount,
                                        String ocrPaidDate,
                                        String ocrPurpose,
                                        String ocrStudentNumber,
                                        MultipartFile receiptFile,
                                        boolean autoVerify) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("phoneNumber is required.");
        }
        if (transactionId == null || transactionId.isBlank()) {
            throw new IllegalArgumentException("transactionId is required.");
        }
        if (amount == null) {
            throw new IllegalArgumentException("amount is required.");
        }
        if (paidDate == null) {
            throw new IllegalArgumentException("paidDate is required.");
        }
        if (receiptFile == null || receiptFile.isEmpty()) {
            throw new IllegalArgumentException("Receipt file is required.");
        }

        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        Optional<Payment> existing = repository.findByExternalReference(transactionId);
        if (existing.isPresent() && !existing.get().getId().equals(paymentId)) {
            throw new IllegalArgumentException("Transaction ID has already been used.");
        }

        if (payment.getAmount() == null || payment.getAmount().compareTo(amount) != 0) {
            throw new IllegalArgumentException("Payment amount does not match the expected 3,000 RWF.");
        }

        payment.setMethod(method != null ? method : PaymentMethod.URUBUTO_PAY);
        payment.setPayerPhoneNumber(phoneNumber);
        payment.setExternalReference(transactionId);
        payment.setReceiptFilePath(storeReceipt(receiptFile));
        payment.setReceiptIssuedAt(paidDate.atStartOfDay());
        payment.setPaidAt(paidDate.atStartOfDay());
        payment.setReceiptStatus(PaymentReceiptStatus.PENDING);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setOcrName(ocrName);
        payment.setOcrTransactionId(ocrTransactionId);
        payment.setOcrPhoneNumber(ocrPhoneNumber);
        payment.setOcrAmount(ocrAmount);
        payment.setOcrPaidDate(ocrPaidDate);
        payment.setOcrPurpose(ocrPurpose);
        payment.setOcrStudentNumber(ocrStudentNumber);

        if (autoVerify && attemptUrubutoVerification(transactionId)) {
            payment.setReceiptStatus(PaymentReceiptStatus.VALID);
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(paidDate.atStartOfDay());
        }

        return repository.save(payment);
    }

    @Transactional(readOnly = true)
    public String buildReceiptReportCsv() {
        List<Payment> payments = repository.findAll();
        StringBuilder builder = new StringBuilder();
        builder.append("Payment ID,Student ID,Student Number,Phone,Transaction ID,Amount,Currency,Method,Status,Receipt Status,Paid At,Receipt Uploaded At\n");
        for (Payment payment : payments) {
            builder.append(payment.getId()).append(',');
            builder.append(payment.getStudent() != null ? payment.getStudent().getId() : "").append(',');
            builder.append(payment.getStudent() != null ? safeCsv(payment.getStudent().getStudentNumber()) : "").append(',');
            builder.append(safeCsv(payment.getPayerPhoneNumber())).append(',');
            builder.append(safeCsv(payment.getExternalReference())).append(',');
            builder.append(payment.getAmount() != null ? payment.getAmount() : "").append(',');
            builder.append(safeCsv(payment.getCurrency())).append(',');
            builder.append(payment.getMethod() != null ? payment.getMethod().name() : "").append(',');
            builder.append(payment.getStatus() != null ? payment.getStatus().name() : "").append(',');
            builder.append(payment.getReceiptStatus() != null ? payment.getReceiptStatus().name() : "").append(',');
            builder.append(payment.getPaidAt() != null ? payment.getPaidAt() : "").append(',');
            builder.append(payment.getReceiptIssuedAt() != null ? payment.getReceiptIssuedAt() : "").append('\n');
        }
        return builder.toString();
    }

    @Transactional(readOnly = true)
    public byte[] buildReceiptReportPdf() {
        List<Payment> payments = repository.findAll().stream()
                .sorted((a, b) -> Long.compare(
                        b.getId() != null ? b.getId() : 0L,
                        a.getId() != null ? a.getId() : 0L))
                .toList();

        BigDecimal totalAmount = payments.stream()
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long paidCount = payments.stream()
                .filter(p -> p.getStatus() != null && (
                        p.getStatus() == PaymentStatus.PAID
                                || p.getStatus() == PaymentStatus.VERIFIED
                                || p.getStatus() == PaymentStatus.COMPLETED))
                .count();
        long pendingCount = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .count();

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        DateTimeFormatter dateTimeFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
        Font subtitleFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
        Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD);
        Font normalFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20f, 20f, 22f, 20f);
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph uni = new Paragraph("ADVENTIST UNIVERSITY OF CENTRAL AFRICA", sectionFont);
            uni.setAlignment(Element.ALIGN_CENTER);
            document.add(uni);

            Paragraph dept = new Paragraph("Finance & Student Accounts Department", subtitleFont);
            dept.setAlignment(Element.ALIGN_CENTER);
            document.add(dept);

            Paragraph contact = new Paragraph("www.auca.ac.rw  |  Kigali, Rwanda", subtitleFont);
            contact.setAlignment(Element.ALIGN_CENTER);
            document.add(contact);
            document.add(new Paragraph(" "));

            Paragraph title = new Paragraph("PAYMENT RECEIPTS REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph sub = new Paragraph("Student Financial Transactions Summary", subtitleFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            document.add(sub);

            Paragraph generated = new Paragraph("Generated on: " + LocalDate.now().format(dateFmt), subtitleFont);
            generated.setAlignment(Element.ALIGN_CENTER);
            document.add(generated);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("REPORT SUMMARY", sectionFont));
            document.add(new Paragraph(" "));

            PdfPTable summary = new PdfPTable(4);
            summary.setWidthPercentage(100);
            summary.setWidths(new float[]{2f, 2f, 1.4f, 1.4f});
            addSummaryCell(summary, "Total Records", String.valueOf(payments.size()));
            addSummaryCell(summary, "Total Amount (RWF)", formatMoney(totalAmount));
            addSummaryCell(summary, "Paid", String.valueOf(paidCount));
            addSummaryCell(summary, "Pending", String.valueOf(pendingCount));
            document.add(summary);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("PAYMENT DETAILS", sectionFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(10);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.8f, 0.8f, 1.2f, 1.3f, 1.5f, 1.2f, 1.1f, 1f, 1f, 1.1f});

            addHeaderCell(table, "Payment ID");
            addHeaderCell(table, "Student ID");
            addHeaderCell(table, "Student No.");
            addHeaderCell(table, "Phone");
            addHeaderCell(table, "Transaction ID");
            addHeaderCell(table, "Amount (RWF)");
            addHeaderCell(table, "Method");
            addHeaderCell(table, "Status");
            addHeaderCell(table, "Receipt Status");
            addHeaderCell(table, "Paid At");

            for (Payment payment : payments) {
                addBodyCell(table, valueOf(payment.getId()));
                addBodyCell(table, payment.getStudent() != null ? valueOf(payment.getStudent().getId()) : "-");
                addBodyCell(table, payment.getStudent() != null ? safeText(payment.getStudent().getStudentNumber()) : "-");
                addBodyCell(table, safeText(payment.getPayerPhoneNumber()));
                addBodyCell(table, safeText(payment.getExternalReference()));
                addBodyCell(table, payment.getAmount() != null ? formatMoney(payment.getAmount()) : "-");
                addBodyCell(table, payment.getMethod() != null ? payment.getMethod().name().replace('_', ' ') : "-");
                addBodyCell(table, payment.getStatus() != null ? payment.getStatus().name() : "-");
                addBodyCell(table, payment.getReceiptStatus() != null ? payment.getReceiptStatus().name() : "-");
                addBodyCell(table, payment.getPaidAt() != null ? payment.getPaidAt().format(dateTimeFmt) : "-");
            }
            document.add(table);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("NOTES & LEGEND", sectionFont));
            document.add(new Paragraph("PAID: Payment successfully received and confirmed by the system.", normalFont));
            document.add(new Paragraph("PENDING: Payment is awaiting confirmation or still being processed.", normalFont));
            document.add(new Paragraph("VALID: Receipt has been verified and accepted by Finance.", normalFont));
            document.add(new Paragraph("All amounts are in Rwandan Francs (RWF).", normalFont));
            document.add(new Paragraph("This report was auto-generated from the AUCA Student Payment System.", normalFont));
            document.add(new Paragraph(" "));

            Paragraph footer = new Paragraph(
                    "Adventist University of Central Africa | Finance Department | Kigali, Rwanda | www.auca.ac.rw",
                    subtitleFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (IOException | DocumentException ex) {
            throw new IllegalArgumentException("Failed to generate receipt PDF report.");
        }
    }

    @Transactional(readOnly = true)
    public List<Payment> listReceiptReviews() {
        return repository.findByReceiptFilePathIsNotNullOrderByReceiptIssuedAtDesc();
    }

    @Transactional
    public TransactionImportResponse importTransactionList(MultipartFile file) {
        return transactionService.importCsv(file);
    }

    @Transactional
    public Payment verifyReceipt(Long paymentId, PaymentReceiptStatus decision, String notes, Long verifiedByUserId) {
        if (decision == null) {
            throw new IllegalArgumentException("decision is required.");
        }

        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        if (decision == PaymentReceiptStatus.VALID && transactionService.isStrictRegistryEnabled()) {
            PaymentTransactionService.MatchResult match = transactionService.evaluateMatch(payment);
            if (!"MATCHED".equals(match.getStatus())) {
                throw new IllegalArgumentException("Cannot validate receipt: " + match.getMessage());
            }
            transactionService.findByTransactionId(payment.getExternalReference())
                    .ifPresent(record -> transactionService.markMatched(record, payment));
        }

        payment.setReceiptStatus(decision);
        payment.setReceiptNotes(notes);
        payment.setReceiptVerifiedAt(LocalDateTime.now());

        if (verifiedByUserId != null) {
            UserAccount verifier = userAccountRepository.findById(verifiedByUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Verifier user not found: " + verifiedByUserId));
            payment.setVerifiedBy(verifier);
        }

        if (decision == PaymentReceiptStatus.VALID) {
            payment.setStatus(PaymentStatus.PAID);
        } else if (decision == PaymentReceiptStatus.REJECTED) {
            payment.setStatus(PaymentStatus.REJECTED);
        }

        return repository.save(payment);
    }

    @Transactional(readOnly = true)
    public PaymentTransactionService.MatchResult getTransactionMatch(Payment payment) {
        return transactionService.evaluateMatch(payment);
    }

    @Transactional(readOnly = true)
    public Resource loadReceiptFile(Long paymentId) {
        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));
        if (payment.getReceiptFilePath() == null || payment.getReceiptFilePath().isBlank()) {
            throw new IllegalArgumentException("Receipt file not available.");
        }
        return loadResource(payment.getReceiptFilePath());
    }

    @Transactional(readOnly = true)
    public PaymentGateResponse checkAccessGate(Long studentId, Long termId) {
        AcademicTerm term = resolveTerm(termId);
        Optional<Payment> paymentOpt = repository.findByStudentIdAndTermId(studentId, term.getId());

        if (paymentOpt.isEmpty()) {
            return new PaymentGateResponse(false, "Mandatory payment obligation not created yet.", "MISSING");
        }

        Payment payment = paymentOpt.get();
        PaymentStatus status = payment.getStatus();
        boolean allowed = status == PaymentStatus.VERIFIED
                || status == PaymentStatus.PAID
                || (status == PaymentStatus.COMPLETED && payment.getMethod() == PaymentMethod.MOBILE_MONEY);
        String message = allowed ? "Access granted." : "Access denied. Mandatory 3,000 RWF fee is not settled or verified.";
        return new PaymentGateResponse(allowed, message, status.name());
    }

    @Transactional(readOnly = true)
    public PaymentReportResponse getTermReport(Long termId) {
        AcademicTerm term = resolveTerm(termId);
        EnumSet<PaymentStatus> paidStatuses = EnumSet.of(PaymentStatus.COMPLETED, PaymentStatus.VERIFIED, PaymentStatus.PAID);

        long totalBilled = repository.countByTermId(term.getId());
        long totalPaid = repository.countByTermIdAndStatusIn(term.getId(), paidStatuses);
        long totalUnpaid = totalBilled - totalPaid;
        double paidPercentage = totalBilled == 0 ? 0.0 : (totalPaid * 100.0) / totalBilled;

        List<UnpaidStudentItem> unpaidStudents = repository.findByTermIdAndStatusNotIn(term.getId(), paidStatuses)
                .stream()
                .map(p -> new UnpaidStudentItem(
                        p.getId(),
                        p.getStudent().getId(),
                        p.getStudent().getStudentNumber(),
                        p.getStudent().getUserAccount().getFirstName() + " " + p.getStudent().getUserAccount().getLastName(),
                        p.getStatus().name()
                ))
                .toList();

        return new PaymentReportResponse(
                term.getId(),
                totalBilled,
                totalPaid,
                totalUnpaid,
                paidPercentage,
                unpaidStudents
        );
    }

    @Transactional(readOnly = true)
    public Optional<Payment> findStudentTermPayment(Long studentId, Long termId) {
        AcademicTerm term = resolveTerm(termId);
        return repository.findByStudentIdAndTermId(studentId, term.getId());
    }

    private AcademicTerm resolveTerm(Long termId) {
        if (termId != null) {
            return academicTermRepository.findById(termId)
                    .orElseThrow(() -> new IllegalArgumentException("Academic term not found: " + termId));
        }

        return academicTermRepository.findByActiveTrue()
                .orElseThrow(() -> new IllegalArgumentException("No active academic term found."));
    }

    private String generateReceiptNumber(Long studentId, Long termId) {
        return "AUCASA-" + termId + "-" + studentId + "-" + System.currentTimeMillis();
    }

    private String storeReceipt(MultipartFile file) {
        try {
            validateReceiptFile(file);
            Files.createDirectories(receiptUploadDir);
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "receipt";
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = "receipt-" + System.currentTimeMillis() + "-" + safeName;
            Path destination = receiptUploadDir.resolve(filename).normalize();
            if (!destination.startsWith(receiptUploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(file.getInputStream(), destination);
            return destination.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store receipt file.");
        }
    }

    private void validateReceiptFile(MultipartFile file) {
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        boolean contentOk = contentType.startsWith("image/");
        boolean extOk = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
        if (!contentOk || !extOk) {
            throw new IllegalArgumentException("Receipt must be a JPG or PNG image.");
        }
    }

    private Resource loadResource(String storedPath) {
        try {
            Path path = Paths.get(storedPath).toAbsolutePath().normalize();
            return new UrlResource(path.toUri());
        } catch (Exception ex) {
            throw new IllegalArgumentException("File not available.");
        }
    }

    private Path resolveReceiptDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "receipts").toAbsolutePath().normalize();
    }

    private boolean attemptUrubutoVerification(String transactionId) {
        if (urubutoSimulate || urubutoVerifyUrl == null || urubutoVerifyUrl.isBlank()) {
            return false;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = urubutoVerifyUrl;
            if (url.contains("{transactionId}")) {
                url = url.replace("{transactionId}", transactionId);
            } else if (!url.contains("?")) {
                url = url + "?transactionId=" + transactionId;
            } else {
                url = url + "&transactionId=" + transactionId;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                return false;
            }
            Object status = response.get("status");
            if (status != null && "SUCCESS".equalsIgnoreCase(status.toString())) {
                return true;
            }
            Object success = response.get("success");
            return success instanceof Boolean && (Boolean) success;
        } catch (Exception ex) {
            return false;
        }
    }

    private String safeCsv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
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

    private void addSummaryCell(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, new Font(Font.HELVETICA, 8, Font.BOLD)));
        labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        labelCell.setPadding(4f);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, new Font(Font.HELVETICA, 9, Font.NORMAL)));
        valueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        valueCell.setPadding(4f);
        table.addCell(valueCell);
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String valueOf(Long value) {
        return value == null ? "-" : String.valueOf(value);
    }

    private String formatMoney(BigDecimal amount) {
        return amount == null ? "-" : amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }
}
