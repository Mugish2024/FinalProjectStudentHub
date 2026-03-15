package aucasa.com.rw.controller;

import aucasa.com.rw.dto.election.ElectionCandidateAdminResponse;
import aucasa.com.rw.dto.election.ElectionCandidateResponse;
import aucasa.com.rw.service.ElectionCandidateService;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/elections/candidates")
public class ElectionCandidateController {
    private final ElectionCandidateService service;

    public ElectionCandidateController(ElectionCandidateService service) {
        this.service = service;
    }

    @PostMapping("/apply")
    public ResponseEntity<?> apply(
            @RequestParam String studentNumber,
            @RequestParam String position,
            @RequestParam(required = false) String slogan,
            @RequestParam(required = false) String manifesto,
            @RequestParam String gpa,
            @RequestParam String credits,
            @RequestParam String disciplineStatus,
            @RequestParam(required = false) MultipartFile adventistProof,
            @RequestParam MultipartFile transcript,
            @RequestParam MultipartFile professionalPhoto,
            @RequestParam MultipartFile certificates
    ) {
        try {
            ElectionCandidateAdminResponse response = service.applyCandidate(
                    studentNumber,
                    position,
                    slogan,
                    manifesto,
                    gpa,
                    credits,
                    disciplineStatus,
                    adventistProof,
                    transcript,
                    professionalPhoto,
                    certificates
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/approved")
    public List<ElectionCandidateResponse> getApproved() {
        return service.listApproved();
    }

    @GetMapping("/pending")
    public List<ElectionCandidateAdminResponse> getPending() {
        return service.listPending();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try {
            ElectionCandidateAdminResponse response = service.approveCandidate(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<?> getPhoto(@PathVariable Long id) {
        try {
            Resource resource = service.loadCandidatePhoto(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .body(resource);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
