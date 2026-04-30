package aucasa.com.rw.controller;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.service.ElectionService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/elections")
public class ElectionController {
    private final ElectionService service;

    public ElectionController(ElectionService service) {
        this.service = service;
    }

    @GetMapping
    public List<Election> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Election> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<Election> getActive() {
        return service.findActiveElection()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Election> create(@RequestBody Election payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @PostMapping("/{id}/open-voting")
    public ResponseEntity<?> openVoting(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.openVoting(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/close-voting")
    public ResponseEntity<?> closeVoting(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.closeVoting(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            return ResponseEntity.ok(service.updateStatus(id, status));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
