package aucasa.com.rw.dto.payment;

public class VerifyPaymentRequest {
    private Long verifiedByUserId;

    public Long getVerifiedByUserId() {
        return verifiedByUserId;
    }

    public void setVerifiedByUserId(Long verifiedByUserId) {
        this.verifiedByUserId = verifiedByUserId;
    }
}
