package aucasa.com.rw.controller;

import aucasa.com.rw.domain.AttendanceRecord;
import aucasa.com.rw.service.AttendanceRecordService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance-records")
public class AttendanceRecordController {
    private final AttendanceRecordService service;

    public AttendanceRecordController(AttendanceRecordService service) {
        this.service = service;
    }

    @GetMapping
    public List<AttendanceRecord> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceRecord> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AttendanceRecord> create(@RequestBody AttendanceRecord payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
