package aucasa.com.rw.dto.payment;

import aucasa.com.rw.domain.enums.PaymentMethod;

public class SubmitPaymentRequest {
    private PaymentMethod method;
    private String phoneNumber;
    private String externalReference;

    public PaymentMethod getMethod() {
        return method;
    }

    public void setMethod(PaymentMethod method) {
        this.method = method;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public void setExternalReference(String externalReference) {
        this.externalReference = externalReference;
    }
}
