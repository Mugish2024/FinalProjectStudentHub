package aucasa.com.rw.dto.payment;

public class UnpaidStudentItem {
    private Long paymentId;
    private Long studentId;
    private String studentNumber;
    private String fullName;
    private String status;

    public UnpaidStudentItem(Long paymentId, Long studentId, String studentNumber, String fullName, String status) {
        this.paymentId = paymentId;
        this.studentId = studentId;
        this.studentNumber = studentNumber;
        this.fullName = fullName;
        this.status = status;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public String getStatus() {
        return status;
    }
}
