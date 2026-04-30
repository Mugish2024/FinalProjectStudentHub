package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.PaymentMethod;
import aucasa.com.rw.domain.enums.PaymentReceiptStatus;
import aucasa.com.rw.domain.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "term_id")
    private AcademicTerm term;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    private String currency = "RWF";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 80, unique = true)
    private String receiptNumber;

    @Column(length = 120)
    private String externalReference;

    @Column(length = 30)
    private String payerPhoneNumber;

    @Column
    private LocalDateTime paidAt;

    @Column
    private LocalDateTime receiptIssuedAt;

    @Column
    private LocalDateTime receiptValidUntil;

    @Column(length = 255)
    private String receiptFilePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentReceiptStatus receiptStatus = PaymentReceiptStatus.PENDING;

    @Column
    private LocalDateTime receiptVerifiedAt;

    @Column(length = 800)
    private String receiptNotes;

    @Column(length = 160)
    private String ocrName;

    @Column(length = 120)
    private String ocrTransactionId;

    @Column(length = 40)
    private String ocrPhoneNumber;

    @Column(length = 40)
    private String ocrAmount;

    @Column(length = 40)
    private String ocrPaidDate;

    @Column(length = 160)
    private String ocrPurpose;

    @Column(length = 40)
    private String ocrStudentNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private UserAccount verifiedBy;

    public StudentProfile getStudent() {
        return student;
    }

    public void setStudent(StudentProfile student) {
        this.student = student;
    }

    public AcademicTerm getTerm() {
        return term;
    }

    public void setTerm(AcademicTerm term) {
        this.term = term;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentMethod getMethod() {
        return method;
    }

    public void setMethod(PaymentMethod method) {
        this.method = method;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public void setExternalReference(String externalReference) {
        this.externalReference = externalReference;
    }

    public String getPayerPhoneNumber() {
        return payerPhoneNumber;
    }

    public void setPayerPhoneNumber(String payerPhoneNumber) {
        this.payerPhoneNumber = payerPhoneNumber;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public UserAccount getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(UserAccount verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public LocalDateTime getReceiptIssuedAt() {
        return receiptIssuedAt;
    }

    public void setReceiptIssuedAt(LocalDateTime receiptIssuedAt) {
        this.receiptIssuedAt = receiptIssuedAt;
    }

    public LocalDateTime getReceiptValidUntil() {
        return receiptValidUntil;
    }

    public void setReceiptValidUntil(LocalDateTime receiptValidUntil) {
        this.receiptValidUntil = receiptValidUntil;
    }

    public String getReceiptFilePath() {
        return receiptFilePath;
    }

    public void setReceiptFilePath(String receiptFilePath) {
        this.receiptFilePath = receiptFilePath;
    }

    public PaymentReceiptStatus getReceiptStatus() {
        return receiptStatus;
    }

    public void setReceiptStatus(PaymentReceiptStatus receiptStatus) {
        this.receiptStatus = receiptStatus;
    }

    public LocalDateTime getReceiptVerifiedAt() {
        return receiptVerifiedAt;
    }

    public void setReceiptVerifiedAt(LocalDateTime receiptVerifiedAt) {
        this.receiptVerifiedAt = receiptVerifiedAt;
    }

    public String getReceiptNotes() {
        return receiptNotes;
    }

    public void setReceiptNotes(String receiptNotes) {
        this.receiptNotes = receiptNotes;
    }

    public String getOcrName() {
        return ocrName;
    }

    public void setOcrName(String ocrName) {
        this.ocrName = ocrName;
    }

    public String getOcrTransactionId() {
        return ocrTransactionId;
    }

    public void setOcrTransactionId(String ocrTransactionId) {
        this.ocrTransactionId = ocrTransactionId;
    }

    public String getOcrPhoneNumber() {
        return ocrPhoneNumber;
    }

    public void setOcrPhoneNumber(String ocrPhoneNumber) {
        this.ocrPhoneNumber = ocrPhoneNumber;
    }

    public String getOcrAmount() {
        return ocrAmount;
    }

    public void setOcrAmount(String ocrAmount) {
        this.ocrAmount = ocrAmount;
    }

    public String getOcrPaidDate() {
        return ocrPaidDate;
    }

    public void setOcrPaidDate(String ocrPaidDate) {
        this.ocrPaidDate = ocrPaidDate;
    }

    public String getOcrPurpose() {
        return ocrPurpose;
    }

    public void setOcrPurpose(String ocrPurpose) {
        this.ocrPurpose = ocrPurpose;
    }

    public String getOcrStudentNumber() {
        return ocrStudentNumber;
    }

    public void setOcrStudentNumber(String ocrStudentNumber) {
        this.ocrStudentNumber = ocrStudentNumber;
    }
}
