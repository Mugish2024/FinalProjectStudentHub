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
@CrossOrigin(originPatterns = {
        "http://localhost:5173",
        "https://localhost:5173",
        "http://127.0.0.1:5173",
        "https://127.0.0.1:5173",
        "http://10.*.*.*:5173",
        "https://10.*.*.*:5173",
        "http://192.168.*.*:5173",
        "https://192.168.*.*:5173",
        "https://*.loca.lt",
        "https://*.trycloudflare.com"
})
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
    public ResponseEntity<?> getApproved(
            @RequestParam(required = false) String electionStatus,
            @RequestParam(required = false) Long electionId
    ) {
        try {
            if (electionId != null) {
                return ResponseEntity.ok(service.listApprovedByElection(electionId));
            }
            return ResponseEntity.ok(service.listApprovedByStatus(electionStatus));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
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
