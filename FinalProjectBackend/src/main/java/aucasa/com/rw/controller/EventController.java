package aucasa.com.rw.controller;

import aucasa.com.rw.domain.Event;
import aucasa.com.rw.service.EventService;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService service;

    public EventController(EventService service) {
        this.service = service;
    }

    @GetMapping
    public List<Event> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Event> create(@RequestBody Event payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @PostMapping("/notices")
    public ResponseEntity<?> createNotice(
            @RequestParam String title,
            @RequestParam String organizer,
            @RequestParam String eventDate,
            @RequestParam(required = false) String eventTime,
            @RequestParam(required = false) String location,
            @RequestParam String description,
            @RequestParam(required = false) MultipartFile image
    ) {
        try {
            Event event = service.createGuildNotice(title, organizer, eventDate, eventTime, location, description, image);
            return ResponseEntity.ok(event);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/notices/{id}")
    public ResponseEntity<?> updateNotice(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String organizer,
            @RequestParam String eventDate,
            @RequestParam(required = false) String eventTime,
            @RequestParam(required = false) String location,
            @RequestParam String description,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(defaultValue = "false") boolean removeImage
    ) {
        try {
            Event event = service.updateGuildNotice(
                    id,
                    title,
                    organizer,
                    eventDate,
                    eventTime,
                    location,
                    description,
                    image,
                    removeImage
            );
            return ResponseEntity.ok(event);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<?> getEventImage(@PathVariable Long id) {
        try {
            Resource resource = service.loadEventImage(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .body(resource);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            service.deleteEventWithImage(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
