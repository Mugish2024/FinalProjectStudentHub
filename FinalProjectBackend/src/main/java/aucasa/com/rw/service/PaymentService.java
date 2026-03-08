package aucasa.com.rw.service;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.Payment;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.PaymentMethod;
import aucasa.com.rw.domain.enums.PaymentStatus;
import aucasa.com.rw.dto.payment.PaymentGateResponse;
import aucasa.com.rw.dto.payment.PaymentReportResponse;
import aucasa.com.rw.dto.payment.UnpaidStudentItem;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.PaymentRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import aucasa.com.rw.service.mobilemoney.MobileMoneyPushResult;
import aucasa.com.rw.service.mobilemoney.MobileMoneyService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private static final BigDecimal MANDATORY_FEE_AMOUNT = new BigDecimal("3000.00");
    private static final String CURRENCY = "RWF";

    private final PaymentRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final AcademicTermRepository academicTermRepository;
    private final UserAccountRepository userAccountRepository;
    private final MobileMoneyService mobileMoneyService;

    public PaymentService(
            PaymentRepository repository,
            StudentProfileRepository studentProfileRepository,
            AcademicTermRepository academicTermRepository,
            UserAccountRepository userAccountRepository,
            MobileMoneyService mobileMoneyService
    ) {
        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.academicTermRepository = academicTermRepository;
        this.userAccountRepository = userAccountRepository;
        this.mobileMoneyService = mobileMoneyService;
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

        if (payment.getStatus() != PaymentStatus.COMPLETED && payment.getStatus() != PaymentStatus.VERIFIED) {
            throw new IllegalArgumentException("Only COMPLETED payments can be verified.");
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

    @Transactional(readOnly = true)
    public PaymentGateResponse checkAccessGate(Long studentId, Long termId) {
        AcademicTerm term = resolveTerm(termId);
        Optional<Payment> paymentOpt = repository.findByStudentIdAndTermId(studentId, term.getId());

        if (paymentOpt.isEmpty()) {
            return new PaymentGateResponse(false, "Mandatory payment obligation not created yet.", "MISSING");
        }

        PaymentStatus status = paymentOpt.get().getStatus();
        boolean allowed = status == PaymentStatus.COMPLETED || status == PaymentStatus.VERIFIED;
        String message = allowed ? "Access granted." : "Access denied. Mandatory 3,000 RWF fee is not settled.";
        return new PaymentGateResponse(allowed, message, status.name());
    }

    @Transactional(readOnly = true)
    public PaymentReportResponse getTermReport(Long termId) {
        AcademicTerm term = resolveTerm(termId);
        EnumSet<PaymentStatus> paidStatuses = EnumSet.of(PaymentStatus.COMPLETED, PaymentStatus.VERIFIED);

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
}
