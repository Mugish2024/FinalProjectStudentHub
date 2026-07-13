package aucasa.com.rw.controller;

import aucasa.com.rw.dto.attendance.AttendanceCheckInRequest;
import aucasa.com.rw.dto.attendance.AttendanceQrTokenResponse;
import aucasa.com.rw.dto.attendance.AttendanceRecordAdminResponse;
import aucasa.com.rw.dto.attendance.AttendanceRecordResponse;
import aucasa.com.rw.dto.attendance.AttendanceSessionResponse;
import aucasa.com.rw.dto.attendance.AttendanceVerificationRequest;
import aucasa.com.rw.service.AttendanceService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceRecordController {
    private final AttendanceService service;

    public AttendanceRecordController(AttendanceService service) {
        this.service = service;
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(@RequestParam(defaultValue = "true") boolean active) {
        try {
            return ResponseEntity.ok(service.listSessions(active));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/sessions/{id}/active")
    public ResponseEntity<?> updateSessionStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        try {
            boolean active = body.getOrDefault("active", true);
            AttendanceSessionResponse result = service.toggleSessionActive(id, active);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/sessions/{id}/qr-token")
    public ResponseEntity<?> generateSessionQrToken(@PathVariable Long id) {
        try {
            AttendanceQrTokenResponse result = service.generateSessionQrToken(id);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/sessions/active/qr-token")
    public ResponseEntity<?> generateActiveSessionQrToken() {
        try {
            AttendanceQrTokenResponse result = service.generateActiveSessionQrToken();
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
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

    @PatchMapping("/sessions/{id}/open-range")
    public ResponseEntity<?> openSessionWithRange(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            LocalDateTime start = parseDateTime(body != null ? body.get("startsAt") : null);
            LocalDateTime end = parseDateTime(body != null ? body.get("endsAt") : null);
            AttendanceSessionResponse result = service.toggleSessionActive(id, true, start, end);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/sessions/special")
    public ResponseEntity<?> createSpecialSession(@RequestBody Map<String, Object> body) {
        try {
            String title = asString(body != null ? body.get("title") : null);
            String campus = asString(body != null ? body.get("campus") : null);
            Object slotsPayload = body != null ? body.get("slots") : null;
            if (slotsPayload instanceof List<?> slots && !slots.isEmpty()) {
                List<AttendanceService.SpecialSessionSlot> parsedSlots = new ArrayList<>();
                for (Object item : slots) {
                    if (!(item instanceof Map<?, ?> slot)) {
                        throw new IllegalArgumentException("Invalid special attendance slot.");
                    }
                    LocalDate date = parseDate(asString(slot.get("date")));
                    LocalTime startsAt = parseTime(asString(slot.get("startsAt")));
                    LocalTime endsAt = parseTime(asString(slot.get("endsAt")));
                    parsedSlots.add(new AttendanceService.SpecialSessionSlot(date, startsAt, endsAt));
                }
                return ResponseEntity.ok(service.createSpecialSessions(title, campus, parsedSlots));
            }

            LocalDateTime start = parseDateTime(asString(body != null ? body.get("startsAt") : null));
            Integer durationMinutes = parseInteger(asString(body != null ? body.get("durationMinutes") : null));
            return ResponseEntity.ok(service.createSpecialSession(title, campus, start, durationMinutes));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/sessions/{id}/special")
    public ResponseEntity<?> deleteSpecialSessionGroup(@PathVariable Long id) {
        try {
            int deleted = service.deleteSpecialSessionGroup(id);
            return ResponseEntity.ok(Map.of("deleted", deleted));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/sessions/{id}/student-status")
    public ResponseEntity<?> getStudentSessionStatus(@PathVariable Long id, @RequestParam String studentNumber) {
        try {
            return ResponseEntity.ok(Map.of("checkedIn", service.hasStudentCheckedIn(id, studentNumber)));
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

    @GetMapping("/report/pdf")
    public ResponseEntity<?> exportAttendanceReportPdf(@RequestParam Long sessionId) {
        try {
            byte[] pdf = service.buildSessionPresentReportPdf(sessionId);
            String filename = "attendance-present-session-" + sessionId + "-" + LocalDate.now() + ".pdf";
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

    @PostMapping("/absence")
    public ResponseEntity<?> submitAbsence(
            @RequestParam String studentNumber,
            @RequestParam Long sessionId,
            @RequestParam String absenceReason,
            @RequestParam(required = false) MultipartFile supportingDocument
    ) {
        try {
            AttendanceRecordResponse result = service.submitAbsence(studentNumber, sessionId, absenceReason, supportingDocument);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/records/{id}/absence-document")
    public ResponseEntity<?> absenceDocument(@PathVariable Long id) {
        try {
            Resource resource = service.loadAbsenceDocument(id);
            return ResponseEntity.ok()
                    .contentType(mediaTypeFor(resource))
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                            .filename(resource.getFilename() != null ? resource.getFilename() : "absence-document")
                            .build()
                            .toString())
                    .body(resource);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
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

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid date format.");
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Slot date is required.");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid slot date.");
        }
    }

    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Slot start and end times are required.");
        }
        try {
            return LocalTime.parse(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid slot time.");
        }
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid duration.");
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private MediaType mediaTypeFor(Resource resource) {
        String filename = resource.getFilename();
        String lower = filename != null ? filename.toLowerCase() : "";
        if (lower.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
