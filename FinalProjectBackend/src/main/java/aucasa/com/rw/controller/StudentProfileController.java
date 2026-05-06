package aucasa.com.rw.controller;

import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.dto.student.StudentRegistrationRequest;
import aucasa.com.rw.dto.student.StudentRegistrationResponse;
import aucasa.com.rw.service.StudentProfileService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class StudentProfileController {
    private final StudentProfileService service;

    public StudentProfileController(StudentProfileService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentProfile> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<StudentProfile> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/summary")
    public List<StudentRegistrationResponse> getAllSummaries() {
        return service.findAllSummaries();
    }

    @GetMapping("/summary/search")
    public ResponseEntity<?> findSummaryByStudentNumber(@RequestParam String studentNumber) {
        if (studentNumber == null || studentNumber.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "studentNumber is required"));
        }
        return service.findSummaryByStudentNumber(studentNumber.trim())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StudentProfile> create(@RequestBody StudentProfile payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody StudentRegistrationRequest request) {
        try {
            StudentRegistrationResponse response = service.registerStudent(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/register/demo")
    public ResponseEntity<?> registerDemoStudents() {
        try {
            return ResponseEntity.ok(service.createDemoStudents());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody StudentRegistrationRequest request) {
        try {
            StudentRegistrationResponse response = service.updateStudent(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}

