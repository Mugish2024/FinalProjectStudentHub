package aucasa.com.rw.dto.studentcard;

import java.time.LocalDateTime;

public class StudentCardApplicationResponse {
    private Long id;
    private String studentNumber;
    private String studentName;
    private String faculty;
    private String department;
    private String program;
    private String status;
    private LocalDateTime appliedAt;
    private LocalDateTime printedAt;
    private boolean replacementRequest;
    private boolean financeReceiptUploaded;
    private LocalDateTime receiptUploadedAt;
    private String financeReceiptStatus;
    private String financeReceiptMessage;
    private LocalDateTime financeReceiptReviewedAt;
    private String photoReviewStatus;
    private String photoReviewMessage;
    private LocalDateTime photoReviewedAt;
    private String printedByName;

    public StudentCardApplicationResponse(
            Long id,
            String studentNumber,
            String studentName,
            String faculty,
            String department,
            String program,
            String status,
            LocalDateTime appliedAt,
            LocalDateTime printedAt,
            boolean replacementRequest,
            boolean financeReceiptUploaded,
            LocalDateTime receiptUploadedAt,
            String financeReceiptStatus,
            String financeReceiptMessage,
            LocalDateTime financeReceiptReviewedAt,
            String photoReviewStatus,
            String photoReviewMessage,
            LocalDateTime photoReviewedAt,
            String printedByName
    ) {
        this.id = id;
        this.studentNumber = studentNumber;
        this.studentName = studentName;
        this.faculty = faculty;
        this.department = department;
        this.program = program;
        this.status = status;
        this.appliedAt = appliedAt;
        this.printedAt = printedAt;
        this.replacementRequest = replacementRequest;
        this.financeReceiptUploaded = financeReceiptUploaded;
        this.receiptUploadedAt = receiptUploadedAt;
        this.financeReceiptStatus = financeReceiptStatus;
        this.financeReceiptMessage = financeReceiptMessage;
        this.financeReceiptReviewedAt = financeReceiptReviewedAt;
        this.photoReviewStatus = photoReviewStatus;
        this.photoReviewMessage = photoReviewMessage;
        this.photoReviewedAt = photoReviewedAt;
        this.printedByName = printedByName;
    }

    public Long getId() {
        return id;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getFaculty() {
        return faculty;
    }

    public String getDepartment() {
        return department;
    }

    public String getProgram() {
        return program;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public LocalDateTime getPrintedAt() {
        return printedAt;
    }

    public boolean isReplacementRequest() {
        return replacementRequest;
    }

    public boolean isFinanceReceiptUploaded() {
        return financeReceiptUploaded;
    }

    public LocalDateTime getReceiptUploadedAt() {
        return receiptUploadedAt;
    }

    public String getFinanceReceiptStatus() {
        return financeReceiptStatus;
    }

    public String getFinanceReceiptMessage() {
        return financeReceiptMessage;
    }

    public LocalDateTime getFinanceReceiptReviewedAt() {
        return financeReceiptReviewedAt;
    }

    public String getPhotoReviewStatus() {
        return photoReviewStatus;
    }

    public String getPhotoReviewMessage() {
        return photoReviewMessage;
    }

    public LocalDateTime getPhotoReviewedAt() {
        return photoReviewedAt;
    }

    public String getPrintedByName() {
        return printedByName;
    }
}
