package aucasa.com.rw.dto.payment;

public class ReceiptAccessQrResponse {
    private boolean goodToGo;
    private String message;
    private String qrToken;
    private String studentName;
    private String studentNumber;
    private String receiptNumber;

    public boolean isGoodToGo() {
        return goodToGo;
    }

    public void setGoodToGo(boolean goodToGo) {
        this.goodToGo = goodToGo;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public void setStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }
}

