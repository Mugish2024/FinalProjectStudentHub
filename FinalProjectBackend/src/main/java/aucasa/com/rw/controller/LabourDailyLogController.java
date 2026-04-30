package aucasa.com.rw.controller;

import aucasa.com.rw.dto.labour.LabourDailyLogRequest;
import aucasa.com.rw.dto.labour.LabourDailyLogResponse;
import aucasa.com.rw.dto.labour.LabourDailyLogReviewRequest;
import aucasa.com.rw.dto.labour.LabourBackfillApprovalRequest;
import aucasa.com.rw.dto.labour.LabourMonthlyPerformanceItem;
import aucasa.com.rw.service.LabourDailyLogService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/labour-daily-logs")
public class LabourDailyLogController {
    private final LabourDailyLogService service;

    public LabourDailyLogController(LabourDailyLogService service) {
        this.service = service;
    }

    @GetMapping
    public List<LabourDailyLogResponse> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String studentNumber
    ) {
        return service.listLogs(status, department, studentNumber);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody LabourDailyLogRequest request) {
        try {
            LabourDailyLogResponse response = service.submitLog(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/reminders")
    public ResponseEntity<?> reminders(@RequestParam String studentNumber) {
        try {
            return ResponseEntity.ok(service.getStudentReminders(studentNumber));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/monthly-performance")
    public ResponseEntity<?> monthlyPerformance(
            @RequestParam(required = false) String campus,
            @RequestParam(required = false) String roleTitle,
            @RequestParam(required = false) String month
    ) {
        try {
            List<LabourMonthlyPerformanceItem> response = service.getMonthlyPerformance(campus, roleTitle, month);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id, @RequestBody LabourDailyLogReviewRequest request) {
        try {
            LabourDailyLogResponse response = service.reviewLog(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/backfill/approve")
    public ResponseEntity<?> approveBackfill(@RequestBody LabourBackfillApprovalRequest request) {
        try {
            String message = service.approveLateBackfill(
                    request.getStudentNumber(),
                    request.getApprovalNote(),
                    request.getApprovedBy()
            );
            return ResponseEntity.ok(Map.of("message", message));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/report/pdf")
    public ResponseEntity<?> exportDeanLabourReportPdf(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String roleTitle
    ) {
        try {
            byte[] pdf = service.buildDeanLabourReportPdf(department, roleTitle);
            String filename = "dean-labour-report-" + LocalDate.now() + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/report/student/pdf")
    public ResponseEntity<?> exportStudentLabourReportPdf(@RequestParam String studentNumber) {
        try {
            byte[] pdf = service.buildStudentLabourReportPdf(studentNumber);
            String filename = "student-labour-report-" + studentNumber + "-" + LocalDate.now() + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
