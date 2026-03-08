package aucasa.com.rw.controller;

import aucasa.com.rw.domain.LabourApplication;
import aucasa.com.rw.service.LabourApplicationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/labour-applications")
public class LabourApplicationController {
    private final LabourApplicationService service;

    public LabourApplicationController(LabourApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public List<LabourApplication> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<LabourApplication> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LabourApplication> create(@RequestBody LabourApplication payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
