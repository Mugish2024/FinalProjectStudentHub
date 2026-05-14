package aucasa.com.rw.controller;

import aucasa.com.rw.domain.RegistrationRecord;
import aucasa.com.rw.dto.student.StudentCourseEnrollmentResponse;
import aucasa.com.rw.service.RegistrationRecordService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationRecordController {
    private final RegistrationRecordService service;

    public RegistrationRecordController(RegistrationRecordService service) {
        this.service = service;
    }

    @GetMapping
    public List<RegistrationRecord> getAll() { return service.findAll(); }

    @GetMapping("/student/{studentNumber}/current-term-courses")
    public ResponseEntity<?> getCurrentTermCourses(@PathVariable String studentNumber) {
        try {
            List<StudentCourseEnrollmentResponse> courses = service.findCurrentTermCoursesByStudentNumber(studentNumber);
            return ResponseEntity.ok(courses);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistrationRecord> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RegistrationRecord> create(@RequestBody RegistrationRecord payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
