package aucasa.com.rw.service;

import aucasa.com.rw.dto.payment.ReceiptOcrResponse;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PaymentReceiptOcrService {
    private static final Pattern TRANSACTION_PATTERN =
            Pattern.compile("(?i)(transaction id|txn id|txnid|txid|reference|ref)\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9\\- ]{4,})");
    private static final Pattern TRANSACTION_DIGITS_PATTERN =
            Pattern.compile("(?i)(txn\\s*id|txnid|txnlid|txnl)\\s*[:\\-]?\\s*([0-9]{10,})");
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("(\\+?2507\\d{8,9}|07\\d{8,9})");
    private static final Pattern AMOUNT_PATTERN =
            Pattern.compile("(?i)(amount|total|paid)\\s*[:\\-]?\\s*([0-9][0-9,\\.]+)\\s*(RWF|FRW|RW)");
    private static final Pattern AMOUNT_FALLBACK_PATTERN =
            Pattern.compile("([0-9][0-9,\\.]+)\\s*(RWF|FRW|RW)");
    private static final Pattern AMOUNT_PREFIX_PATTERN =
            Pattern.compile("(?i)(RWF|FRW|RW)\\s*([0-9][0-9,\\.]+)");
    private static final Pattern DATE_PATTERN =
            Pattern.compile("(\\d{4}-\\d{2}-\\d{2}|\\d{4}/\\d{2}/\\d{2}|\\d{2}/\\d{2}/\\d{4}|\\d{2}-\\d{2}-\\d{4})");
    private static final Pattern NAME_PATTERN =
            Pattern.compile("(?i)(name|payer|customer)\\s*[:\\-]?\\s*([A-Z][A-Z\\s]{3,})");
    private static final Pattern PURPOSE_PATTERN =
            Pattern.compile("(?i)\\bfor\\s+(.+?)(?:\\s+to\\b|\\s+txn|\\s+txnid|\\s+txnl|\\s+ref|\\s+reference|$)");
    private static final Pattern STUDENT_NUMBER_PATTERN =
            Pattern.compile("\\((\\d{5,10})\\)");

    private final String tesseractPath;
    private final boolean ocrEnabled;

    public PaymentReceiptOcrService(
            @Value("${app.ocr.tesseract-path:}") String tesseractPath,
            @Value("${app.ocr.enabled:true}") boolean ocrEnabled
    ) {
        this.tesseractPath = tesseractPath;
        this.ocrEnabled = ocrEnabled;
    }

    public ReceiptOcrResponse scanReceipt(MultipartFile receiptFile) {
        ReceiptOcrResponse response = new ReceiptOcrResponse();
        if (!ocrEnabled) {
            response.setMessage("OCR is disabled.");
            return response;
        }
        if (receiptFile == null || receiptFile.isEmpty()) {
            response.setMessage("Receipt file is required.");
            return response;
        }

        File tempFile = null;
        try {
            tempFile = createTempFile(receiptFile);
            ITesseract tesseract = new Tesseract();
            TessdataConfig config = resolveTessdataPath();
            if (config == null) {
                response.setMessage("OCR failed: tessdata path not found. Check app.ocr.tesseract-path.");
                return response;
            }
            tesseract.setDatapath(config.tessdataPath);
            if (config.prefixPath != null) {
                System.setProperty("TESSDATA_PREFIX", config.prefixPath);
            }
            tesseract.setLanguage("eng");
            String rawText = tesseract.doOCR(tempFile);
            response.setRawText(rawText);
            parseFields(rawText, response);
            response.setMessage("OCR completed.");
            return response;
        } catch (TesseractException ex) {
            response.setMessage("OCR failed. Ensure Tesseract is installed and tessdata path is correct.");
            return response;
        } catch (Error err) {
            response.setMessage("OCR failed: Tesseract native library error. Check tessdata path.");
            return response;
        } catch (Exception ex) {
            response.setMessage("OCR failed: " + ex.getMessage());
            return response;
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    private void parseFields(String rawText, ReceiptOcrResponse response) {
        String text = rawText == null ? "" : rawText.replace("\r", "\n");
        String[] lines = text.split("\n");

        Matcher txnDigits = TRANSACTION_DIGITS_PATTERN.matcher(text);
        if (txnDigits.find()) {
            response.setTransactionId(txnDigits.group(2));
        } else {
            Matcher txnMatch = TRANSACTION_PATTERN.matcher(text);
            if (txnMatch.find()) {
                String normalized = normalizeToken(txnMatch.group(2));
                response.setTransactionId(cleanTransaction(normalized));
            } else {
                for (String line : lines) {
                    String normalized = line.trim();
                    if (normalized.toLowerCase().contains("txn") && normalized.matches(".*\\d{8,}.*")) {
                        String digits = normalized.replaceAll("[^0-9]", "");
                        if (digits.length() >= 10) {
                            response.setTransactionId(digits);
                            break;
                        }
                    }
                }
            }
        }

        Matcher phoneMatch = PHONE_PATTERN.matcher(text);
        if (phoneMatch.find()) {
            response.setPhoneNumber(phoneMatch.group(1));
        }

        Matcher amountMatch = AMOUNT_PATTERN.matcher(text);
        if (amountMatch.find()) {
            response.setAmount(amountMatch.group(2).replace(",", ""));
        } else {
            Matcher prefix = AMOUNT_PREFIX_PATTERN.matcher(text);
            if (prefix.find()) {
                response.setAmount(prefix.group(2).replace(",", ""));
            }
            Matcher fallback = AMOUNT_FALLBACK_PATTERN.matcher(text);
            if (fallback.find()) {
                response.setAmount(fallback.group(1).replace(",", ""));
            }
        }

        Matcher dateMatch = DATE_PATTERN.matcher(text);
        if (dateMatch.find()) {
            response.setPaidDate(normalizeDate(dateMatch.group(1)));
        }

        if (response.getTransactionId() != null && response.getPaidDate() != null) {
            String txn = response.getTransactionId();
            String dateDigits = response.getPaidDate().replace("-", "");
            if (txn.endsWith(dateDigits) && txn.length() - dateDigits.length() >= 10) {
                response.setTransactionId(txn.substring(0, txn.length() - dateDigits.length()));
            }
        }

        Matcher nameMatch = NAME_PATTERN.matcher(text);
        if (nameMatch.find()) {
            response.setName(nameMatch.group(2).trim());
        } else {
            for (int i = 0; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.equalsIgnoreCase("Payment Successful!") && i + 1 < lines.length) {
                    String candidate = lines[i + 1].trim();
                    if (candidate.matches("[A-Za-z][A-Za-z\\s]{5,}") && !candidate.toLowerCase().contains("paid")) {
                        response.setName(candidate);
                        break;
                    }
                }
            }
        }

        Matcher purposeMatch = PURPOSE_PATTERN.matcher(text);
        if (purposeMatch.find()) {
            response.setPurpose(cleanPurpose(purposeMatch.group(1)));
        } else {
            for (String line : lines) {
                String normalized = line.trim();
                if (normalized.toLowerCase().contains(" for ")) {
                    Matcher lineMatch = PURPOSE_PATTERN.matcher(normalized);
                    if (lineMatch.find()) {
                        response.setPurpose(cleanPurpose(lineMatch.group(1)));
                        break;
                    }
                }
            }
        }

        Matcher studentMatch = STUDENT_NUMBER_PATTERN.matcher(text);
        if (studentMatch.find()) {
            response.setStudentNumber(studentMatch.group(1));
        }

        if (response.getTransactionId() == null) {
            for (int i = 0; i < lines.length; i++) {
                String line = lines[i].trim().toLowerCase();
                if (line.contains("txn") || line.contains("txnl") || line.contains("txnld")) {
                    if (i + 1 < lines.length) {
                        String next = lines[i + 1].trim();
                        String digits = next.replaceAll("[^0-9]", "");
                        if (digits.length() >= 8) {
                            response.setTransactionId(digits);
                            break;
                        }
                    }
                }
            }
        }
    }

    private String normalizeToken(String value) {
        if (value == null) return null;
        return value.trim().replaceAll("\\s+", "");
    }

    private String cleanTransaction(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("[^0-9]", "");
        if (digits.length() >= 10) {
            return digits;
        }
        return value.trim();
    }

    private String normalizeDate(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        try {
            if (trimmed.matches("\\d{4}/\\d{2}/\\d{2}")) {
                LocalDate date = LocalDate.parse(trimmed, DateTimeFormatter.ofPattern("yyyy/MM/dd", Locale.ENGLISH));
                return date.toString();
            }
            if (trimmed.contains("/")) {
                LocalDate date = LocalDate.parse(trimmed, DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ENGLISH));
                return date.toString();
            }
            if (trimmed.matches("\\d{2}-\\d{2}-\\d{4}")) {
                LocalDate date = LocalDate.parse(trimmed, DateTimeFormatter.ofPattern("dd-MM-yyyy", Locale.ENGLISH));
                return date.toString();
            }
            LocalDate date = LocalDate.parse(trimmed, DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.ENGLISH));
            return date.toString();
        } catch (Exception ex) {
            return trimmed;
        }
    }

    private String cleanPurpose(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = value.replaceAll("\\s+", " ").trim();
        if (cleaned.length() > 160) {
            return cleaned.substring(0, 160).trim();
        }
        return cleaned;
    }

    private File createTempFile(MultipartFile receiptFile) throws Exception {
        String original = receiptFile.getOriginalFilename() != null ? receiptFile.getOriginalFilename() : "receipt";
        String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path temp = Files.createTempFile("receipt-ocr-", "-" + safeName);
        Files.write(temp, receiptFile.getBytes());
        return temp.toFile();
    }

    private TessdataConfig resolveTessdataPath() {
        List<String> candidates = new ArrayList<>();
        if (tesseractPath != null && !tesseractPath.isBlank()) {
            candidates.add(tesseractPath);
        }

        String envPrefix = System.getenv("TESSDATA_PREFIX");
        if (envPrefix != null && !envPrefix.isBlank()) {
            candidates.add(envPrefix);
        }

        candidates.add("C:/Program Files/Tesseract-OCR");
        candidates.add("C:/Program Files/Tesseract-OCR/tessdata");
        candidates.add("C:/Program Files (x86)/Tesseract-OCR");
        candidates.add("C:/Program Files (x86)/Tesseract-OCR/tessdata");

        for (String candidate : candidates) {
            TessdataConfig config = resolveFromCandidate(candidate);
            if (config != null) {
                return config;
            }
        }
        return null;
    }

    private TessdataConfig resolveFromCandidate(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return null;
        }
        String normalized = candidate.replace("\\", "/").trim();
        Path base = Paths.get(normalized);
        Path tessdata = base;
        if (!base.getFileName().toString().equalsIgnoreCase("tessdata")) {
            Path child = base.resolve("tessdata");
            if (Files.exists(child.resolve("eng.traineddata"))) {
                tessdata = child;
            }
        }
        if (!Files.exists(tessdata.resolve("eng.traineddata"))) {
            return null;
        }
        String tessdataPath = tessdata.toAbsolutePath().normalize().toString();
        String prefixPath = tessdata.getParent() != null ? tessdata.getParent().toAbsolutePath().normalize().toString() : tessdataPath;
        return new TessdataConfig(tessdataPath, prefixPath);
    }

    private static class TessdataConfig {
        private final String tessdataPath;
        private final String prefixPath;

        private TessdataConfig(String tessdataPath, String prefixPath) {
            this.tessdataPath = tessdataPath;
            this.prefixPath = prefixPath;
        }
    }
}
