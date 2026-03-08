package aucasa.com.rw.controller;

import aucasa.com.rw.domain.DisciplineRecord;
import aucasa.com.rw.service.DisciplineRecordService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/discipline-records")
public class DisciplineRecordController {
    private final DisciplineRecordService service;

    public DisciplineRecordController(DisciplineRecordService service) {
        this.service = service;
    }

    @GetMapping
    public List<DisciplineRecord> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<DisciplineRecord> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DisciplineRecord> create(@RequestBody DisciplineRecord payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
