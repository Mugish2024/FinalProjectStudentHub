package aucasa.com.rw.controller;

import aucasa.com.rw.dto.labour.LabourActivityRequest;
import aucasa.com.rw.dto.labour.LabourActivityResponse;
import aucasa.com.rw.service.LabourActivityService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/labour-activities")
public class LabourActivityController {
    private final LabourActivityService service;

    public LabourActivityController(LabourActivityService service) {
        this.service = service;
    }

    @GetMapping
    public List<LabourActivityResponse> getAll(@RequestParam(required = false) Boolean activeOnly) {
        return service.list(activeOnly);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LabourActivityRequest request) {
        try {
            return ResponseEntity.ok(service.create(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}

