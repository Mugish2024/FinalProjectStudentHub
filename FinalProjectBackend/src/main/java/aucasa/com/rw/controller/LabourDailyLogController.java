package aucasa.com.rw.controller;

import aucasa.com.rw.dto.labour.LabourDailyLogRequest;
import aucasa.com.rw.dto.labour.LabourDailyLogResponse;
import aucasa.com.rw.dto.labour.LabourDailyLogReviewRequest;
import aucasa.com.rw.service.LabourDailyLogService;
import java.util.List;
import java.util.Map;
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
}
