package aucasa.com.rw.dto.payment;

public class PaymentWalletResponse {
    private String walletName;
    private String walletCode;
    private String provider;
    private String bankAccount;
    private String currency;

    public PaymentWalletResponse() {
    }

    public PaymentWalletResponse(String walletName, String walletCode, String provider, String bankAccount, String currency) {
        this.walletName = walletName;
        this.walletCode = walletCode;
        this.provider = provider;
        this.bankAccount = bankAccount;
        this.currency = currency;
    }

    public String getWalletName() {
        return walletName;
    }

    public void setWalletName(String walletName) {
        this.walletName = walletName;
    }

    public String getWalletCode() {
        return walletCode;
    }

    public void setWalletCode(String walletCode) {
        this.walletCode = walletCode;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getBankAccount() {
        return bankAccount;
    }

    public void setBankAccount(String bankAccount) {
        this.bankAccount = bankAccount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}

