package aucasa.com.rw.dto.attendance;

import java.time.LocalDateTime;

public class AttendanceSessionResponse {
    private Long id;
    private String title;
    private String campus;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private boolean active;

    public AttendanceSessionResponse(Long id, String title, String campus, LocalDateTime startsAt, LocalDateTime endsAt, boolean active) {
        this.id = id;
        this.title = title;
        this.campus = campus;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getCampus() {
        return campus;
    }

    public LocalDateTime getStartsAt() {
        return startsAt;
    }

    public LocalDateTime getEndsAt() {
        return endsAt;
    }

    public boolean isActive() {
        return active;
    }
}
