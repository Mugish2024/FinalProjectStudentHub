package aucasa.com.rw.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {
    private Long id;
    private Long studentId;
    private String studentNumber;
    private Long termId;
    private BigDecimal amount;
    private String currency;
    private String method;
    private String status;
    private String receiptNumber;
    private String externalReference;
    private String payerPhoneNumber;
    private LocalDateTime paidAt;
    private LocalDateTime receiptIssuedAt;
    private LocalDateTime receiptValidUntil;
    private String receiptStatus;
    private String receiptFilePath;
    private LocalDateTime receiptVerifiedAt;
    private String receiptNotes;
    private String ocrName;
    private String ocrTransactionId;
    private String ocrPhoneNumber;
    private String ocrAmount;
    private String ocrPaidDate;
    private String ocrPurpose;
    private String ocrStudentNumber;
    private String studentName;
    private String registryMatchStatus;
    private String registryMatchMessage;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public void setStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public Long getTermId() {
        return termId;
    }

    public void setTermId(Long termId) {
        this.termId = termId;
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

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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

    public String getReceiptStatus() {
        return receiptStatus;
    }

    public void setReceiptStatus(String receiptStatus) {
        this.receiptStatus = receiptStatus;
    }

    public String getReceiptFilePath() {
        return receiptFilePath;
    }

    public void setReceiptFilePath(String receiptFilePath) {
        this.receiptFilePath = receiptFilePath;
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

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getRegistryMatchStatus() {
        return registryMatchStatus;
    }

    public void setRegistryMatchStatus(String registryMatchStatus) {
        this.registryMatchStatus = registryMatchStatus;
    }

    public String getRegistryMatchMessage() {
        return registryMatchMessage;
    }

    public void setRegistryMatchMessage(String registryMatchMessage) {
        this.registryMatchMessage = registryMatchMessage;
    }
}
