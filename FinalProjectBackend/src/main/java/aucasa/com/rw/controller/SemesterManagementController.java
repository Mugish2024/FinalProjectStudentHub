package aucasa.com.rw.controller;

import aucasa.com.rw.dto.semester.SemesterManagementResponse;
import aucasa.com.rw.dto.semester.SemesterRequest;
import aucasa.com.rw.dto.semester.SemesterRolloverResponse;
import aucasa.com.rw.service.SemesterManagementService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/semesters")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class SemesterManagementController {
    private final SemesterManagementService service;

    public SemesterManagementController(SemesterManagementService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<SemesterManagementResponse> getSemesters() {
        return ResponseEntity.ok(service.getManagementSnapshot());
    }

    @PostMapping
    public ResponseEntity<?> createSemester(@RequestBody SemesterRequest request) {
        try {
            SemesterRolloverResponse response = service.createNewSemester(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
