package aucasa.com.rw.dto.payment;

public class PaymentGateResponse {
    private boolean allowed;
    private String message;
    private String paymentStatus;

    public PaymentGateResponse(boolean allowed, String message, String paymentStatus) {
        this.allowed = allowed;
        this.message = message;
        this.paymentStatus = paymentStatus;
    }

    public boolean isAllowed() {
        return allowed;
    }

    public String getMessage() {
        return message;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }
}
