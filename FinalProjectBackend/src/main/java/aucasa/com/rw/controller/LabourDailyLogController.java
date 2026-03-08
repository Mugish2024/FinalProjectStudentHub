package aucasa.com.rw.controller;

import aucasa.com.rw.domain.LabourDailyLog;
import aucasa.com.rw.service.LabourDailyLogService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/labour-daily-logs")
public class LabourDailyLogController {
    private final LabourDailyLogService service;

    public LabourDailyLogController(LabourDailyLogService service) {
        this.service = service;
    }

    @GetMapping
    public List<LabourDailyLog> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<LabourDailyLog> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LabourDailyLog> create(@RequestBody LabourDailyLog payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
