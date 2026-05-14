package aucasa.com.rw.controller;

import aucasa.com.rw.domain.Payment;
import aucasa.com.rw.dto.payment.CreateObligationRequest;
import aucasa.com.rw.dto.payment.MobileMoneyCallbackRequest;
import aucasa.com.rw.dto.payment.MobileMoneyStartRequest;
import aucasa.com.rw.dto.payment.PaymentGateResponse;
import aucasa.com.rw.dto.payment.PaymentReportResponse;
import aucasa.com.rw.dto.payment.PaymentResponse;
import aucasa.com.rw.dto.payment.PaymentStartResponse;
import aucasa.com.rw.dto.payment.PaymentWalletResponse;
import aucasa.com.rw.dto.payment.TransactionImportResponse;
import aucasa.com.rw.dto.payment.ReceiptVerificationRequest;
import aucasa.com.rw.dto.payment.ReceiptAccessQrResponse;
import aucasa.com.rw.dto.payment.SelfReceiptVerifyRequest;
import aucasa.com.rw.dto.payment.SubmitPaymentRequest;
import aucasa.com.rw.dto.payment.VerifyPaymentRequest;
import aucasa.com.rw.dto.payment.ReceiptOcrResponse;
import aucasa.com.rw.domain.enums.PaymentMethod;
import aucasa.com.rw.domain.enums.PaymentReceiptStatus;
import aucasa.com.rw.service.PaymentService;
import aucasa.com.rw.service.ImsPaymentGatewayService;
import aucasa.com.rw.service.PaymentReceiptOcrService;
import aucasa.com.rw.service.PaymentTransactionService;
import aucasa.com.rw.service.mobilemoney.MobileMoneyPushResult;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class PaymentController {
    private final PaymentService service;
    private final ImsPaymentGatewayService imsPaymentGatewayService;
    private final PaymentReceiptOcrService ocrService;

    public PaymentController(PaymentService service, ImsPaymentGatewayService imsPaymentGatewayService, PaymentReceiptOcrService ocrService) {
        this.service = service;
        this.imsPaymentGatewayService = imsPaymentGatewayService;
        this.ocrService = ocrService;
    }

    @GetMapping
    public List<PaymentResponse> getAll() {
        return service.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/wallet")
    public ResponseEntity<PaymentWalletResponse> getCollectionWallet() {
        return ResponseEntity.ok(service.getCollectionWallet());
    }

    @GetMapping("/ims/student/{studentId}/snapshot")
    public ResponseEntity<?> getImsSnapshot(@PathVariable String studentId) {
        try {
            return ResponseEntity.ok(imsPaymentGatewayService.fetchStudentPaymentSnapshot(studentId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/ims/registry/all")
    public ResponseEntity<?> getImsAllPayments() {
        try {
            Map<String, Object> ims = imsPaymentGatewayService.fetchAllStudentPayments();
            Object data = ims.get("data");
            if (data instanceof List<?> list && !list.isEmpty()) {
                return ResponseEntity.ok(ims);
            }
            return ResponseEntity.ok(buildLocalPaymentRegistryPayload("LOCAL_FALLBACK_EMPTY_IMS"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.ok(buildLocalPaymentRegistryPayload("LOCAL_FALLBACK_IMS_CONFIG"));
        } catch (Exception ex) {
            return ResponseEntity.ok(buildLocalPaymentRegistryPayload("LOCAL_FALLBACK_IMS_ERROR"));
        }
    }

    @GetMapping("/history/student/{studentId}")
    public List<PaymentResponse> getHistoryByStudent(@PathVariable Long studentId) {
        return service.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getById(@PathVariable Long id) {
        return service.findById(id).map(p -> ResponseEntity.ok(toResponse(p))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}/term/{termId}")
    public ResponseEntity<PaymentResponse> getByStudentAndTerm(@PathVariable Long studentId, @PathVariable Long termId) {
        return service.findStudentTermPayment(studentId, termId)
                .map(p -> ResponseEntity.ok(toResponse(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> create(@RequestBody Payment payload) {
        return ResponseEntity.ok(toResponse(service.create(payload)));
    }

    @PostMapping("/obligations/student")
    public ResponseEntity<?> createObligationForStudent(@RequestBody CreateObligationRequest request) {
        try {
            if (request.getStudentId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "studentId is required"));
            }
            Payment payment = service.createMandatoryObligation(request.getStudentId(), request.getTermId());
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/obligations/term/{termId}")
    public ResponseEntity<Map<String, Integer>> createObligationsForTerm(@PathVariable Long termId) {
        int created = service.createMandatoryObligationsForTerm(termId);
        return ResponseEntity.ok(Map.of("createdObligations", created));
    }

    @PostMapping("/{paymentId}/submit")
    public ResponseEntity<?> submitPayment(@PathVariable Long paymentId, @RequestBody SubmitPaymentRequest request) {
        try {
            Payment payment = service.submitPayment(
                    paymentId,
                    request.getMethod(),
                    request.getPhoneNumber(),
                    request.getExternalReference()
            );
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{paymentId}/start-mobile-money")
    public ResponseEntity<?> startMobileMoney(@PathVariable Long paymentId, @RequestBody MobileMoneyStartRequest request) {
        try {
            MobileMoneyPushResult push = service.startMobileMoneyPayment(paymentId, request.getPhoneNumber());
            Payment payment = service.findById(paymentId)
                    .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));
            PaymentStartResponse response = new PaymentStartResponse();
            response.setPayment(toResponse(payment));
            response.setInitiated(push.isInitiated());
            response.setMessage(push.getMessage());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/mobile-money/callback")
    public ResponseEntity<?> mobileMoneyCallback(@RequestBody MobileMoneyCallbackRequest request) {
        try {
            Payment payment = service.handleMobileMoneyCallback(
                    request.getReceiptNumber(),
                    request.getProviderReference(),
                    request.isSuccess()
            );
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/mobile-money/pawapay-callback")
    public ResponseEntity<?> pawapayCallback(@RequestBody Map<String, Object> body) {
        try {
            Object depositIdObj = body.get("depositId");
            Object statusObj = body.get("status");
            String depositId = depositIdObj != null ? depositIdObj.toString() : null;
            String status = statusObj != null ? statusObj.toString() : "";
            boolean success = "COMPLETED".equalsIgnoreCase(status) || "SUCCESSFUL".equalsIgnoreCase(status);
            Payment payment = service.handleMobileMoneyCallbackByProviderReference(depositId, success);
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{paymentId}/verify")
    public ResponseEntity<?> verifyPayment(@PathVariable Long paymentId, @RequestBody(required = false) VerifyPaymentRequest request) {
        try {
            Long verifiedByUserId = request != null ? request.getVerifiedByUserId() : null;
            Payment payment = service.verifyPayment(paymentId, verifiedByUserId);
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{paymentId}/receipt")
    public ResponseEntity<?> uploadReceipt(
            @PathVariable Long paymentId,
            @RequestParam String paidDate,
            @RequestParam String validUntil,
            @RequestParam MultipartFile receiptFile
    ) {
        try {
            LocalDate paid = LocalDate.parse(paidDate);
            LocalDate valid = LocalDate.parse(validUntil);
            Payment payment = service.uploadReceipt(paymentId, paid, valid, receiptFile);
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{paymentId}/receipt/submit")
    public ResponseEntity<?> submitUrubutoReceipt(
            @PathVariable Long paymentId,
            @RequestParam String phoneNumber,
            @RequestParam(required = false) String transactionId,
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String paidDate,
            @RequestParam(required = false) String method,
            @RequestParam(required = false, defaultValue = "false") boolean autoVerify,
            @RequestParam MultipartFile receiptFile
    ) {
        try {
            PaymentMethod paymentMethod = method != null && !method.isBlank()
                    ? PaymentMethod.valueOf(method.toUpperCase())
                    : PaymentMethod.URUBUTO_PAY;
            ReceiptOcrResponse ocr = null;
            if (isBlank(transactionId) || amount == null || isBlank(paidDate)) {
                ocr = ocrService.scanReceipt(receiptFile);
            }

            String resolvedTransactionId = !isBlank(transactionId) ? transactionId
                    : (ocr != null ? ocr.getTransactionId() : null);
            BigDecimal resolvedAmount = amount != null ? amount
                    : (ocr != null && !isBlank(ocr.getAmount()) ? new BigDecimal(ocr.getAmount()) : null);
            String resolvedPaidDate = !isBlank(paidDate) ? paidDate
                    : (ocr != null ? ocr.getPaidDate() : null);

            if (isBlank(resolvedTransactionId)) {
                throw new IllegalArgumentException("transactionId is required or must be detected from OCR.");
            }
            if (resolvedAmount == null) {
                throw new IllegalArgumentException("amount is required or must be detected from OCR.");
            }
            if (isBlank(resolvedPaidDate)) {
                throw new IllegalArgumentException("paidDate is required or must be detected from OCR.");
            }

            LocalDate paid = LocalDate.parse(resolvedPaidDate);
            Payment payment = service.submitUrubutoReceipt(
                    paymentId,
                    paymentMethod,
                    phoneNumber,
                    resolvedTransactionId,
                    resolvedAmount,
                    paid,
                    ocr != null ? ocr.getName() : null,
                    ocr != null ? ocr.getTransactionId() : null,
                    ocr != null ? ocr.getPhoneNumber() : null,
                    ocr != null ? ocr.getAmount() : null,
                    ocr != null ? ocr.getPaidDate() : null,
                    ocr != null ? ocr.getPurpose() : null,
                    ocr != null ? ocr.getStudentNumber() : null,
                    receiptFile,
                    autoVerify
            );
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @GetMapping("/receipts/report")
    public ResponseEntity<?> exportReceiptReport() {
        try {
            String csv = service.buildReceiptReportCsv();
            String filename = "payment-receipts-" + LocalDate.now() + ".csv";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(csv);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/receipts/report/pdf")
    public ResponseEntity<?> exportReceiptReportPdf() {
        try {
            byte[] pdf = service.buildReceiptReportPdf();
            String filename = "payment-receipts-" + LocalDate.now() + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/receipts/scan")
    public ResponseEntity<ReceiptOcrResponse> scanReceipt(@RequestParam MultipartFile receiptFile) {
        return ResponseEntity.ok(ocrService.scanReceipt(receiptFile));
    }

    @GetMapping("/receipts/review")
    public List<PaymentResponse> reviewReceipts() {
        return service.listReceiptReviews().stream().map(this::toResponse).toList();
    }

    @PostMapping("/transactions/import")
    public ResponseEntity<?> importTransactions(@RequestParam MultipartFile file) {
        try {
            TransactionImportResponse response = service.importTransactionList(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{paymentId}/receipt/verify")
    public ResponseEntity<?> verifyReceipt(@PathVariable Long paymentId, @RequestBody ReceiptVerificationRequest request) {
        try {
            PaymentReceiptStatus decision = PaymentReceiptStatus.valueOf(request.getDecision().toUpperCase());
            Payment payment = service.verifyReceipt(paymentId, decision, request.getNotes(), request.getVerifiedByUserId());
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{paymentId}/receipt/verify-self")
    public ResponseEntity<?> verifyReceiptForStudent(@PathVariable Long paymentId, @RequestBody SelfReceiptVerifyRequest request) {
        try {
            ReceiptAccessQrResponse response = service.verifyReceiptForStudentAndIssueQr(paymentId, request.getStudentId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/receipt-qr/verify")
    public ResponseEntity<?> verifyReceiptQr(@RequestParam String token) {
        try {
            return ResponseEntity.ok(service.verifyAccessQrToken(token));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{paymentId}/receipt/file")
    public ResponseEntity<?> downloadReceipt(@PathVariable Long paymentId) {
        try {
            Resource resource = service.loadReceiptFile(paymentId);
            String filename = resource.getFilename() != null ? resource.getFilename() : "receipt";
            String contentType = "application/octet-stream";
            try {
                if (resource.getFile() != null) {
                    String detected = java.nio.file.Files.probeContentType(resource.getFile().toPath());
                    if (detected != null) {
                        contentType = detected;
                    }
                }
            } catch (Exception ignored) {
                // fallback to octet-stream
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(resource);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/access-gate")
    public ResponseEntity<?> checkAccessGate(@RequestParam Long studentId, @RequestParam(required = false) Long termId) {
        try {
            PaymentGateResponse response = service.checkAccessGate(studentId, termId);
            return response.isAllowed()
                    ? ResponseEntity.ok(response)
                    : ResponseEntity.status(403).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/reports/term/{termId}")
    public ResponseEntity<PaymentReportResponse> termReport(@PathVariable Long termId) {
        return ResponseEntity.ok(service.getTermReport(termId));
    }

    @GetMapping("/reports/active-term")
    public ResponseEntity<?> activeTermReport() {
        try {
            return ResponseEntity.ok(service.getTermReport(null));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setStudentId(payment.getStudent() != null ? payment.getStudent().getId() : null);
        response.setStudentNumber(
                payment.getStudent() != null ? payment.getStudent().getStudentNumber() : null
        );
        response.setTermId(payment.getTerm() != null ? payment.getTerm().getId() : null);
        response.setAmount(payment.getAmount());
        response.setCurrency(payment.getCurrency());
        response.setMethod(payment.getMethod() != null ? payment.getMethod().name() : null);
        response.setStatus(payment.getStatus() != null ? payment.getStatus().name() : null);
        response.setReceiptNumber(payment.getReceiptNumber());
        response.setExternalReference(payment.getExternalReference());
        response.setPayerPhoneNumber(payment.getPayerPhoneNumber());
        response.setPaidAt(payment.getPaidAt());
        response.setReceiptIssuedAt(payment.getReceiptIssuedAt());
        response.setReceiptValidUntil(payment.getReceiptValidUntil());
        response.setReceiptStatus(payment.getReceiptStatus() != null ? payment.getReceiptStatus().name() : null);
        response.setReceiptFilePath(payment.getReceiptFilePath());
        response.setReceiptVerifiedAt(payment.getReceiptVerifiedAt());
        response.setReceiptNotes(payment.getReceiptNotes());
        response.setOcrName(payment.getOcrName());
        response.setOcrTransactionId(payment.getOcrTransactionId());
        response.setOcrPhoneNumber(payment.getOcrPhoneNumber());
        response.setOcrAmount(payment.getOcrAmount());
        response.setOcrPaidDate(payment.getOcrPaidDate());
        response.setOcrPurpose(payment.getOcrPurpose());
        response.setOcrStudentNumber(payment.getOcrStudentNumber());
        if (payment.getStudent() != null && payment.getStudent().getUserAccount() != null) {
            response.setStudentName(payment.getStudent().getUserAccount().getFirstName() + " " +
                    payment.getStudent().getUserAccount().getLastName());
        }
        PaymentTransactionService.MatchResult match = service.getTransactionMatch(payment);
        response.setRegistryMatchStatus(match.getStatus());
        response.setRegistryMatchMessage(match.getMessage());
        return response;
    }

    private Map<String, Object> buildLocalPaymentRegistryPayload(String source) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Payment payment : service.findAll()) {
            try {
                Map<String, Object> row = new java.util.HashMap<>();
                row.put("id", payment.getId() != null ? payment.getId() : 0L);
                row.put("studentId", payment.getStudent() != null && payment.getStudent().getId() != null
                        ? String.valueOf(payment.getStudent().getId()) : "");
                row.put("studentCode", payment.getStudent() != null && payment.getStudent().getStudentNumber() != null
                        ? payment.getStudent().getStudentNumber() : "");
                row.put("studentNumber", payment.getStudent() != null && payment.getStudent().getStudentNumber() != null
                        ? payment.getStudent().getStudentNumber() : "");
                row.put("studentName", payment.getStudent() != null
                        && payment.getStudent().getUserAccount() != null
                        ? (safe(payment.getStudent().getUserAccount().getFirstName()) + " " + safe(payment.getStudent().getUserAccount().getLastName())).trim()
                        : "");
                row.put("amount", payment.getAmount() != null ? payment.getAmount() : 0);
                row.put("currency", payment.getCurrency() != null ? payment.getCurrency() : "RWF");
                row.put("method", payment.getMethod() != null ? payment.getMethod().name() : "");
                row.put("status", payment.getStatus() != null ? payment.getStatus().name() : "");
                row.put("receiptStatus", payment.getReceiptStatus() != null ? payment.getReceiptStatus().name() : "");
                row.put("externalReference", payment.getExternalReference() != null ? payment.getExternalReference() : "");
                row.put("transactionId", payment.getExternalReference() != null ? payment.getExternalReference() : "");
                row.put("paidAt", payment.getPaidAt() != null ? payment.getPaidAt().toString() : "");
                rows.add(row);
            } catch (Exception ignored) {
                // skip malformed record and continue
            }
        }
        return Map.of("source", source, "count", rows.size(), "data", rows);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}

