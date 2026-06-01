package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.StudentCardApplicationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_card_applications")
public class StudentCardApplication extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @Column(nullable = false, length = 500)
    private String photoPath;

    @Column(length = 500)
    private String financeReceiptPath;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean replacementRequest = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StudentCardApplicationStatus status = StudentCardApplicationStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime appliedAt;

    @Column
    private LocalDateTime printedAt;

    @Column
    private LocalDateTime receiptUploadedAt;

    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'NOT_REQUIRED'")
    private String financeReceiptStatus = "NOT_REQUIRED";

    @Column(length = 300)
    private String financeReceiptMessage;

    @Column
    private LocalDateTime financeReceiptReviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "printed_by_user_id")
    private UserAccount printedBy;

    public StudentProfile getStudent() {
        return student;
    }

    public void setStudent(StudentProfile student) {
        this.student = student;
    }

    public String getPhotoPath() {
        return photoPath;
    }

    public void setPhotoPath(String photoPath) {
        this.photoPath = photoPath;
    }

    public String getFinanceReceiptPath() {
        return financeReceiptPath;
    }

    public void setFinanceReceiptPath(String financeReceiptPath) {
        this.financeReceiptPath = financeReceiptPath;
    }

    public boolean isReplacementRequest() {
        return replacementRequest;
    }

    public void setReplacementRequest(boolean replacementRequest) {
        this.replacementRequest = replacementRequest;
    }

    public StudentCardApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(StudentCardApplicationStatus status) {
        this.status = status;
    }

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public LocalDateTime getPrintedAt() {
        return printedAt;
    }

    public void setPrintedAt(LocalDateTime printedAt) {
        this.printedAt = printedAt;
    }

    public LocalDateTime getReceiptUploadedAt() {
        return receiptUploadedAt;
    }

    public void setReceiptUploadedAt(LocalDateTime receiptUploadedAt) {
        this.receiptUploadedAt = receiptUploadedAt;
    }

    public String getFinanceReceiptStatus() {
        return financeReceiptStatus;
    }

    public void setFinanceReceiptStatus(String financeReceiptStatus) {
        this.financeReceiptStatus = financeReceiptStatus;
    }

    public String getFinanceReceiptMessage() {
        return financeReceiptMessage;
    }

    public void setFinanceReceiptMessage(String financeReceiptMessage) {
        this.financeReceiptMessage = financeReceiptMessage;
    }

    public LocalDateTime getFinanceReceiptReviewedAt() {
        return financeReceiptReviewedAt;
    }

    public void setFinanceReceiptReviewedAt(LocalDateTime financeReceiptReviewedAt) {
        this.financeReceiptReviewedAt = financeReceiptReviewedAt;
    }

    public UserAccount getPrintedBy() {
        return printedBy;
    }

    public void setPrintedBy(UserAccount printedBy) {
        this.printedBy = printedBy;
    }
}
