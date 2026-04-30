package aucasa.com.rw.dto.payment;

public class TransactionImportResponse {
    private int imported;
    private int duplicates;
    private int errors;

    public TransactionImportResponse() {}

    public TransactionImportResponse(int imported, int duplicates, int errors) {
        this.imported = imported;
        this.duplicates = duplicates;
        this.errors = errors;
    }

    public int getImported() {
        return imported;
    }

    public void setImported(int imported) {
        this.imported = imported;
    }

    public int getDuplicates() {
        return duplicates;
    }

    public void setDuplicates(int duplicates) {
        this.duplicates = duplicates;
    }

    public int getErrors() {
        return errors;
    }

    public void setErrors(int errors) {
        this.errors = errors;
    }
}
