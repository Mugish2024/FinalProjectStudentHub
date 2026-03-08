package aucasa.com.rw.service.mobilemoney;

public class MobileMoneyPushResult {
    private final boolean initiated;
    private final String providerReference;
    private final String message;

    public MobileMoneyPushResult(boolean initiated, String providerReference, String message) {
        this.initiated = initiated;
        this.providerReference = providerReference;
        this.message = message;
    }

    public boolean isInitiated() {
        return initiated;
    }

    public String getProviderReference() {
        return providerReference;
    }

    public String getMessage() {
        return message;
    }
}
