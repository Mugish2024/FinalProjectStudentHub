package aucasa.com.rw.controller;

import aucasa.com.rw.dto.studentcard.StudentCardApplicationResponse;
import aucasa.com.rw.service.StudentCardApplicationService;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/student-cards")
public class StudentCardApplicationController {
    private final StudentCardApplicationService service;

    public StudentCardApplicationController(StudentCardApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String status) {
        try {
            List<StudentCardApplicationResponse> response = service.list(status);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/student/{studentNumber}")
    public ResponseEntity<?> latestForStudent(@PathVariable String studentNumber) {
        try {
            StudentCardApplicationResponse response = service.latestForStudent(studentNumber);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestParam String studentNumber, @RequestParam MultipartFile photo) {
        try {
            StudentCardApplicationResponse response = service.submit(studentNumber, photo);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/printed")
    public ResponseEntity<?> markPrinted(@PathVariable Long id, @RequestBody(required = false) Map<String, Long> body) {
        try {
            Long managerUserId = body != null ? body.get("managerUserId") : null;
            StudentCardApplicationResponse response = service.markPrinted(id, managerUserId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/finance-receipt")
    public ResponseEntity<?> uploadFinanceReceipt(
            @PathVariable Long id,
            @RequestParam String studentNumber,
            @RequestParam MultipartFile receipt
    ) {
        try {
            StudentCardApplicationResponse response = service.uploadFinanceReceipt(id, studentNumber, receipt);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/finance-receipt/review")
    public ResponseEntity<?> reviewFinanceReceipt(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String message = body.get("message") != null ? String.valueOf(body.get("message")) : "";
            StudentCardApplicationResponse response = service.reviewFinanceReceipt(id, approved, message);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<?> photo(@PathVariable Long id) {
        try {
            Resource resource = service.loadPhoto(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/finance-receipt")
    public ResponseEntity<?> financeReceipt(@PathVariable Long id) {
        try {
            Resource resource = service.loadFinanceReceipt(id);
            return ResponseEntity.ok()
                    .contentType(mediaTypeFor(resource))
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                            .filename(resource.getFilename() != null ? resource.getFilename() : "finance-receipt")
                            .build()
                            .toString())
                    .body(resource);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
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
