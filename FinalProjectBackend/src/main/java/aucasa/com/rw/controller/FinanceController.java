package aucasa.com.rw.controller;

import aucasa.com.rw.dto.finance.CreateBudgetRequest;
import aucasa.com.rw.dto.finance.CreateExpenseRequest;
import aucasa.com.rw.dto.finance.CreateFundRequestRequest;
import aucasa.com.rw.dto.finance.FinanceBudgetResponse;
import aucasa.com.rw.dto.finance.FinanceExpenseResponse;
import aucasa.com.rw.dto.finance.FinanceFundRequestResponse;
import aucasa.com.rw.dto.finance.FinanceReportResponse;
import aucasa.com.rw.dto.finance.FinanceTransparencyResponse;
import aucasa.com.rw.dto.finance.PublishFinanceUpdateRequest;
import aucasa.com.rw.dto.finance.ReviewFundRequestRequest;
import aucasa.com.rw.dto.finance.UpdateBudgetStatusRequest;
import aucasa.com.rw.service.FinanceService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class FinanceController {
    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/budgets")
    public List<FinanceBudgetResponse> listBudgets() {
        return financeService.listBudgets();
    }

    @PostMapping("/budgets")
    public ResponseEntity<?> createBudget(@RequestBody CreateBudgetRequest request) {
        try {
            FinanceBudgetResponse response = financeService.createBudget(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/budgets/{budgetId}/status")
    public ResponseEntity<?> updateBudgetStatus(@PathVariable Long budgetId, @RequestBody UpdateBudgetStatusRequest request) {
        try {
            FinanceBudgetResponse response = financeService.updateBudgetStatus(
                    budgetId,
                    request != null ? request.getStatus() : null,
                    request != null ? request.getActorRole() : null
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/expenses")
    public List<FinanceExpenseResponse> listExpenses() {
        return financeService.listExpenses();
    }

    @GetMapping("/fund-requests")
    public List<FinanceFundRequestResponse> listFundRequests() {
        return financeService.listFundRequests();
    }

    @PostMapping("/fund-requests")
    public ResponseEntity<?> createFundRequest(@RequestBody CreateFundRequestRequest request) {
        try {
            FinanceFundRequestResponse response = financeService.createFundRequest(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/fund-requests/{requestId}/guild-review")
    public ResponseEntity<?> guildReview(@PathVariable Long requestId, @RequestBody ReviewFundRequestRequest request) {
        try {
            FinanceFundRequestResponse response = financeService.reviewByGuild(requestId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/fund-requests/{requestId}/chief-review")
    public ResponseEntity<?> chiefReview(@PathVariable Long requestId, @RequestBody ReviewFundRequestRequest request) {
        try {
            FinanceFundRequestResponse response = financeService.reviewByChiefFinance(requestId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/expenses")
    public ResponseEntity<?> createExpense(@RequestBody CreateExpenseRequest request) {
        try {
            FinanceExpenseResponse response = financeService.createExpense(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/reports/financial-statement")
    public FinanceReportResponse getFinancialStatement() {
        return financeService.getFinancialReport();
    }

    @GetMapping("/transparency/summary")
    public FinanceTransparencyResponse getTransparencySummary() {
        return financeService.getTransparencySummary();
    }

    @PostMapping("/transparency/publish")
    public ResponseEntity<?> publishTransparencyUpdate(@RequestBody PublishFinanceUpdateRequest request) {
        try {
            FinanceTransparencyResponse response = financeService.publishUpdate(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<?> uploadSupportingDocument(@RequestParam String type, @RequestParam MultipartFile file) {
        try {
            String storedPath = financeService.uploadSupportingDocument(type, file);
            return ResponseEntity.ok(Map.of("storedPath", storedPath));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/documents/view")
    public ResponseEntity<?> viewSupportingDocument(@RequestParam("path") String path) {
        try {
            FinanceService.FinanceDocumentPayload file = financeService.readSupportingDocument(path);
            MediaType mediaType;
            try {
                mediaType = MediaType.parseMediaType(file.getContentType());
            } catch (Exception ex) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .contentType(mediaType)
                    .body(file.getBytes());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/reports/financial-statement/pdf")
    public ResponseEntity<?> downloadFinancialStatementPdf() {
        try {
            byte[] pdf = financeService.buildFinancialReportPdf();
            String filename = "finance-statement-" + LocalDate.now() + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
