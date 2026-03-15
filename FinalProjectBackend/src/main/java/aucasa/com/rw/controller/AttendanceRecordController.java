package aucasa.com.rw.controller;

import aucasa.com.rw.dto.attendance.AttendanceCheckInRequest;
import aucasa.com.rw.dto.attendance.AttendanceRecordAdminResponse;
import aucasa.com.rw.dto.attendance.AttendanceRecordResponse;
import aucasa.com.rw.dto.attendance.AttendanceSessionResponse;
import aucasa.com.rw.dto.attendance.AttendanceVerificationRequest;
import aucasa.com.rw.service.AttendanceService;
import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceRecordController {
    private final AttendanceService service;

    public AttendanceRecordController(AttendanceService service) {
        this.service = service;
    }

    @GetMapping("/sessions")
    public List<AttendanceSessionResponse> getSessions(@RequestParam(defaultValue = "true") boolean active) {
        return service.listSessions(active);
    }

    @GetMapping("/records")
    public ResponseEntity<?> getRecords(@RequestParam String studentNumber) {
        try {
            List<AttendanceRecordResponse> result = service.listRecords(studentNumber);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody AttendanceCheckInRequest request, HttpServletRequest httpRequest) {
        try {
            String clientIp = extractClientIp(httpRequest);
            AttendanceRecordResponse result = service.checkIn(request, clientIp);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/admin/records")
    public ResponseEntity<?> getAdminRecords(
            @RequestParam(required = false) Long sessionId,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String verificationStatus
    ) {
        try {
            List<AttendanceRecordAdminResponse> result = service.listAdminRecords(sessionId, method, status, verificationStatus);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/records/{id}/verify")
    public ResponseEntity<?> verifyRecord(@PathVariable Long id, @RequestBody AttendanceVerificationRequest request) {
        try {
            AttendanceRecordAdminResponse result = service.verifyRecord(id, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
