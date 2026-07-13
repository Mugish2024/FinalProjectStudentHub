package aucasa.com.rw.controller;

import aucasa.com.rw.dto.labour.LabourCreditDeclarationResponse;
import aucasa.com.rw.service.LabourCreditDeclarationService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/labour-credit-declarations")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "http://192.168.*.*:5173", "https://192.168.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class LabourCreditDeclarationController {
    private final LabourCreditDeclarationService service;

    public LabourCreditDeclarationController(LabourCreditDeclarationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> get(@RequestParam String studentNumber) {
        try {
            LabourCreditDeclarationResponse response = service.getDeclaration(studentNumber);
            if (response == null) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(
            @RequestParam String studentNumber,
            @RequestParam Integer totalCredits,
            @RequestParam(required = false) String timetable,
            @RequestParam(required = false) MultipartFile timetableProofFile
    ) {
        try {
            return ResponseEntity.ok(service.submitDeclaration(studentNumber, totalCredits, timetable, timetableProofFile));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
