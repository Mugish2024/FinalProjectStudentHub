package aucasa.com.rw.controller;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.service.ElectionService;
import java.time.LocalDateTime;
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

    @GetMapping("/{id}/vote-trends")
    public ResponseEntity<?> getVoteTrends(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getVoteTrends(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<?> getElectionStatistics(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getElectionStatistics(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/reminders")
    public ResponseEntity<?> sendVotingReminders(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.sendVotingReminders(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<Election> getActive() {
        return service.findActiveElection()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Election payload) {
        try {
            return ResponseEntity.ok(service.create(payload));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/open-voting")
    public ResponseEntity<?> openVoting(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            LocalDateTime start = parseDateTime(body != null ? body.get("votingStart") : null);
            LocalDateTime end = parseDateTime(body != null ? body.get("votingEnd") : null);
            return ResponseEntity.ok(service.openVoting(id, start, end));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid date format.");
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

    @PatchMapping("/{id}/vote-progress-visibility")
    public ResponseEntity<?> updateVoteProgressVisibility(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        try {
            Boolean visible = body.get("visible");
            return ResponseEntity.ok(service.updateVoteProgressVisibility(id, visible));
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
