package aucasa.com.rw.dto.attendance;

import java.time.LocalDateTime;

public class AttendanceSessionResponse {
    private Long id;
    private String title;
    private String campus;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private boolean active;
    private boolean cancelled;
    private boolean defaultWeekly;
    private String specialGroupKey;

    public AttendanceSessionResponse(Long id, String title, String campus, LocalDateTime startsAt, LocalDateTime endsAt, boolean active, boolean cancelled, boolean defaultWeekly, String specialGroupKey) {
        this.id = id;
        this.title = title;
        this.campus = campus;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.active = active;
        this.cancelled = cancelled;
        this.defaultWeekly = defaultWeekly;
        this.specialGroupKey = specialGroupKey;
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

    public boolean isCancelled() {
        return cancelled;
    }

    public boolean isDefaultWeekly() {
        return defaultWeekly;
    }

    public String getSpecialGroupKey() {
        return specialGroupKey;
    }
}
