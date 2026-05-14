package aucasa.com.rw.service;

import aucasa.com.rw.domain.Event;
import aucasa.com.rw.domain.enums.EventCategory;
import aucasa.com.rw.domain.enums.EventStatus;
import aucasa.com.rw.repository.EventRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EventService {
    private final EventRepository repository;
    private final Path eventUploadDir;

    public EventService(
            EventRepository repository,
            @Value("${app.storage.event-upload-dir:}") String uploadDir
    ) {
        this.repository = repository;
        this.eventUploadDir = resolveUploadDir(uploadDir);
    }

    public List<Event> findAll() { return repository.findAll(); }
    public Optional<Event> findById(Long id) { return repository.findById(id); }
    public Event create(Event entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }

    public Event createGuildNotice(
            String title,
            String organizer,
            String eventDate,
            String eventTime,
            String location,
            String description,
            MultipartFile image
    ) {
        if (isBlank(title) || isBlank(organizer) || isBlank(eventDate) || isBlank(description)) {
            throw new IllegalArgumentException("title, organizer, eventDate and description are required.");
        }

        Event event = new Event();
        event.setTitle(title.trim());
        event.setOrganizer(organizer.trim());
        event.setCategory(EventCategory.ADMIN);
        event.setStatus(EventStatus.UPCOMING);
        event.setEventDate(LocalDate.parse(eventDate.trim()));
        event.setDescription(description.trim());
        event.setLocation(isBlank(location) ? "TBA" : location.trim());
        if (!isBlank(eventTime)) {
            event.setEventTime(LocalTime.parse(eventTime.trim()));
        }
        if (image != null && !image.isEmpty()) {
            event.setImagePath(storeImage(image));
        }
        return repository.save(event);
    }

    public Event updateGuildNotice(
            Long id,
            String title,
            String organizer,
            String eventDate,
            String eventTime,
            String location,
            String description,
            MultipartFile image,
            boolean removeImage
    ) {
        Event event = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Event not found."));

        if (isBlank(title) || isBlank(organizer) || isBlank(eventDate) || isBlank(description)) {
            throw new IllegalArgumentException("title, organizer, eventDate and description are required.");
        }

        event.setTitle(title.trim());
        event.setOrganizer(organizer.trim());
        event.setCategory(EventCategory.ADMIN);
        event.setStatus(EventStatus.UPCOMING);
        event.setEventDate(LocalDate.parse(eventDate.trim()));
        event.setDescription(description.trim());
        event.setLocation(isBlank(location) ? "TBA" : location.trim());

        if (!isBlank(eventTime)) {
            event.setEventTime(LocalTime.parse(eventTime.trim()));
        } else {
            event.setEventTime(null);
        }

        if (removeImage) {
            deleteImageQuietly(event.getImagePath());
            event.setImagePath(null);
        }

        if (image != null && !image.isEmpty()) {
            deleteImageQuietly(event.getImagePath());
            event.setImagePath(storeImage(image));
        }

        return repository.save(event);
    }

    public Resource loadEventImage(Long eventId) {
        Event event = repository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));
        if (isBlank(event.getImagePath())) {
            throw new IllegalArgumentException("Event image not available.");
        }
        try {
            Path path = Paths.get(event.getImagePath()).toAbsolutePath().normalize();
            if (!Files.exists(path)) {
                throw new IllegalArgumentException("Event image file not found.");
            }
            return new UrlResource(path.toUri());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to load event image.");
        }
    }

    public void deleteEventWithImage(Long id) {
        Event event = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Event not found."));
        deleteImageQuietly(event.getImagePath());
        repository.delete(event);
    }

    private String storeImage(MultipartFile file) {
        try {
            Files.createDirectories(eventUploadDir);
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "event-image";
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = "event-" + System.currentTimeMillis() + "-" + safeName;
            Path destination = eventUploadDir.resolve(filename).normalize();
            if (!destination.startsWith(eventUploadDir)) {
                throw new IllegalArgumentException("Invalid event image path.");
            }
            Files.copy(file.getInputStream(), destination);
            return destination.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store event image.");
        }
    }

    private Path resolveUploadDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "events").toAbsolutePath().normalize();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void deleteImageQuietly(String imagePath) {
        if (isBlank(imagePath)) {
            return;
        }
        try {
            Path path = Paths.get(imagePath).toAbsolutePath().normalize();
            if (Files.exists(path)) {
                Files.delete(path);
            }
        } catch (Exception ignored) {
            // best effort cleanup
        }
    }
}
