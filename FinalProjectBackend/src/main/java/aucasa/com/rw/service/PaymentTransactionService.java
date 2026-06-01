package aucasa.com.rw.service;

import aucasa.com.rw.domain.Payment;
import aucasa.com.rw.domain.PaymentTransaction;
import aucasa.com.rw.dto.payment.TransactionImportResponse;
import aucasa.com.rw.repository.PaymentTransactionRepository;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PaymentTransactionService {
    private final PaymentTransactionRepository repository;
    private final boolean strictRegistry;
    private final String requiredPurpose;

    public PaymentTransactionService(
            PaymentTransactionRepository repository,
            @Value("${app.payment.registry.strict:true}") boolean strictRegistry,
            @Value("${app.payment.required-purpose:}") String requiredPurpose
    ) {
        this.repository = repository;
        this.strictRegistry = strictRegistry;
        this.requiredPurpose = requiredPurpose != null ? requiredPurpose.trim() : "";
    }

    public boolean isStrictRegistryEnabled() {
        return strictRegistry;
    }

    @Transactional(readOnly = true)
    public Optional<PaymentTransaction> findByTransactionId(String transactionId) {
        if (transactionId == null || transactionId.isBlank()) {
            return Optional.empty();
        }
        return repository.findByTransactionId(transactionId.trim());
    }

    @Transactional
    public TransactionImportResponse importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is required.");
        }

        int imported = 0;
        int duplicates = 0;
        int errors = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) {
                throw new IllegalArgumentException("CSV header is missing.");
            }
            char delimiter = detectDelimiter(headerLine);
            List<String> header = parseCsvLine(headerLine, delimiter);
            Map<String, Integer> index = buildHeaderIndex(header);

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                List<String> cols = parseCsvLine(line, delimiter);
                String transactionId = getValue(cols, index, "transactionid", "transaction_id", "reference", "txn");
                if (transactionId == null || transactionId.isBlank()) {
                    errors++;
                    continue;
                }
                transactionId = transactionId.trim();
                if (repository.existsByTransactionId(transactionId)) {
                    duplicates++;
                    continue;
                }

                String amountValue = getValue(cols, index, "amount", "paid_amount", "value", "amountrwf");
                BigDecimal amount = parseAmount(amountValue);
                if (amount == null) {
                    errors++;
                    continue;
                }

                String currency = getValue(cols, index, "currency");
                String phone = getValue(cols, index, "phone", "phone_number", "payer_phone", "phonenumber", "payerphone");
                String paidAtValue = getValue(cols, index, "paid_at", "paid_date", "date", "timestamp", "paidat", "paymentdate");
                String purpose = getValue(cols, index, "purpose", "payment_for", "description", "type", "paymentpurpose", "fee");
                LocalDateTime paidAt = parseDateTime(paidAtValue);

                PaymentTransaction record = new PaymentTransaction();
                record.setTransactionId(transactionId);
                record.setAmount(amount);
                record.setCurrency(currency != null && !currency.isBlank() ? currency.trim() : "RWF");
                record.setPhoneNumber(phone != null ? phone.trim() : null);
                record.setPaidAt(paidAt);
                record.setPurpose(purpose != null ? purpose.trim() : null);
                record.setSource("INSTITUTION_EXPORT");
                repository.save(record);
                imported++;
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to read CSV file.");
        }

        return new TransactionImportResponse(imported, duplicates, errors);
    }

    @Transactional
    public void markMatched(PaymentTransaction transaction, Payment payment) {
        if (transaction == null || payment == null) {
            return;
        }
        transaction.setMatchedPayment(payment);
        transaction.setMatchedAt(LocalDateTime.now());
        repository.save(transaction);
    }

    public MatchResult evaluateMatch(Payment payment) {
        if (payment == null) {
            return MatchResult.noTransaction("Payment not found.");
        }
        String txn = payment.getExternalReference();
        if (txn == null || txn.isBlank()) {
            return MatchResult.noTransaction("Missing transaction ID.");
        }
        Optional<PaymentTransaction> recordOpt = repository.findByTransactionId(txn.trim());
        if (recordOpt.isEmpty()) {
            return MatchResult.notFound("Transaction ID not found in institution list.");
        }
        PaymentTransaction record = recordOpt.get();
        if (record.getMatchedPayment() != null && !record.getMatchedPayment().getId().equals(payment.getId())) {
            return MatchResult.used("Transaction ID already used by another payment.");
        }
        if (record.getAmount() != null && payment.getAmount() != null
                && record.getAmount().compareTo(payment.getAmount()) != 0) {
            return MatchResult.mismatch("Amount does not match institution record.");
        }
        String recordPhone = normalizePhone(record.getPhoneNumber());
        String paymentPhone = normalizePhone(payment.getPayerPhoneNumber());
        if (recordPhone != null && paymentPhone != null && !recordPhone.equals(paymentPhone)) {
            return MatchResult.mismatch("Phone number does not match institution record.");
        }
        String required = normalizePurpose(requiredPurpose);
        if (required != null) {
            String recordPurpose = normalizePurpose(record.getPurpose());
            String receiptPurpose = normalizePurpose(payment.getOcrPurpose());
            if (recordPurpose != null && !recordPurpose.contains(required)) {
                return MatchResult.mismatch("Payment purpose does not match required fee type.");
            }
            if (recordPurpose == null && receiptPurpose != null && !receiptPurpose.contains(required)) {
                return MatchResult.mismatch("Receipt purpose does not match required fee type.");
            }
            if (recordPurpose == null && receiptPurpose == null) {
                return MatchResult.mismatch("Payment purpose is missing.");
            }
        }
        return MatchResult.matched("Transaction ID verified against institution list.");
    }

    private String normalizePhone(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("[^0-9]", "");
        return digits.isBlank() ? null : digits;
    }

    private String normalizePurpose(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        return normalized.isBlank() ? null : normalized;
    }

    private char detectDelimiter(String headerLine) {
        if (headerLine.contains(";")) {
            return ';';
        }
        if (headerLine.contains("\t")) {
            return '\t';
        }
        return ',';
    }

    private Map<String, Integer> buildHeaderIndex(List<String> header) {
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < header.size(); i++) {
            String rawKey = header.get(i) != null ? header.get(i).trim().toLowerCase(Locale.ROOT) : "";
            String key = rawKey.replaceAll("[^a-z0-9]", "");
            if (!key.isBlank()) {
                index.put(key, i);
            }
        }
        return index;
    }

    private String getValue(List<String> cols, Map<String, Integer> index, String... keys) {
        for (String key : keys) {
            Integer idx = index.get(key);
            if (idx != null && idx < cols.size()) {
                String value = cols.get(idx);
                if (value != null && !value.isBlank()) {
                    return value.trim();
                }
            }
        }
        return null;
    }

    private BigDecimal parseAmount(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String clean = value.replaceAll("[^0-9.]", "");
        if (clean.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(clean);
        } catch (Exception ex) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        List<DateTimeFormatter> formats = new ArrayList<>();
        formats.add(DateTimeFormatter.ISO_DATE_TIME);
        formats.add(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        formats.add(DateTimeFormatter.ISO_LOCAL_DATE);
        formats.add(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        formats.add(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        formats.add(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        formats.add(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        for (DateTimeFormatter formatter : formats) {
            try {
                if (formatter == DateTimeFormatter.ISO_LOCAL_DATE || formatter.toString().contains("yyyy")) {
                    LocalDate date = LocalDate.parse(trimmed, formatter);
                    return date.atStartOfDay();
                }
                return LocalDateTime.parse(trimmed, formatter);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private List<String> parseCsvLine(String line, char delimiter) {
        List<String> result = new ArrayList<>();
        if (line == null) {
            return result;
        }
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }
            if (c == delimiter && !inQuotes) {
                result.add(current.toString());
                current.setLength(0);
                continue;
            }
            current.append(c);
        }
        result.add(current.toString());
        return result;
    }

    public static class MatchResult {
        private final String status;
        private final String message;

        private MatchResult(String status, String message) {
            this.status = status;
            this.message = message;
        }

        public String getStatus() {
            return status;
        }

        public String getMessage() {
            return message;
        }

        public static MatchResult matched(String message) {
            return new MatchResult("MATCHED", message);
        }

        public static MatchResult notFound(String message) {
            return new MatchResult("NOT_FOUND", message);
        }

        public static MatchResult used(String message) {
            return new MatchResult("USED", message);
        }

        public static MatchResult mismatch(String message) {
            return new MatchResult("MISMATCH", message);
        }

        public static MatchResult noTransaction(String message) {
            return new MatchResult("MISSING", message);
        }
    }
}
