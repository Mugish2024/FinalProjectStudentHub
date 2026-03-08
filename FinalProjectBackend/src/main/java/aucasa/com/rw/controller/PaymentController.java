package aucasa.com.rw.controller;

import aucasa.com.rw.domain.Payment;
import aucasa.com.rw.dto.payment.CreateObligationRequest;
import aucasa.com.rw.dto.payment.MobileMoneyCallbackRequest;
import aucasa.com.rw.dto.payment.PaymentGateResponse;
import aucasa.com.rw.dto.payment.PaymentReportResponse;
import aucasa.com.rw.dto.payment.PaymentResponse;
import aucasa.com.rw.dto.payment.SubmitPaymentRequest;
import aucasa.com.rw.dto.payment.VerifyPaymentRequest;
import aucasa.com.rw.service.PaymentService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping
    public List<PaymentResponse> getAll() {
        return service.findAll().stream().map(this::toResponse).toList();
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
        return response;
    }
}
