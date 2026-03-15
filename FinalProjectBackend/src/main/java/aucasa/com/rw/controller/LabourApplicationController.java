package aucasa.com.rw.controller;

import aucasa.com.rw.dto.labour.LabourApplicationResponse;
import aucasa.com.rw.dto.labour.LabourApplicationReviewRequest;
import aucasa.com.rw.service.LabourApplicationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/labour-applications")
public class LabourApplicationController {
    private final LabourApplicationService service;

    public LabourApplicationController(LabourApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public List<LabourApplicationResponse> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String studentNumber
    ) {
        return service.listApplications(status, department, studentNumber);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(
            @RequestParam String studentNumber,
            @RequestParam String department,
            @RequestParam(required = false) String coverLetterText,
            @RequestParam(required = false) MultipartFile coverLetterFile,
            @RequestParam(required = false) MultipartFile transcriptFile
    ) {
        try {
            LabourApplicationResponse response = service.submitApplication(
                    studentNumber,
                    department,
                    coverLetterText,
                    coverLetterFile,
                    transcriptFile
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id, @RequestBody LabourApplicationReviewRequest request) {
        try {
            LabourApplicationResponse response = service.reviewApplication(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
