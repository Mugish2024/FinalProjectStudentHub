package aucasa.com.rw.dto.attendance;

public class AttendanceQrTokenResponse {
    private Long sessionId;
    private String sessionTitle;
    private String campus;
    private String token;
    private String payload;
    private String expiresAt;

    public AttendanceQrTokenResponse(
            Long sessionId,
            String sessionTitle,
            String campus,
            String token,
            String payload,
            String expiresAt
    ) {
        this.sessionId = sessionId;
        this.sessionTitle = sessionTitle;
        this.campus = campus;
        this.token = token;
        this.payload = payload;
        this.expiresAt = expiresAt;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public String getSessionTitle() {
        return sessionTitle;
    }

    public String getCampus() {
        return campus;
    }

    public String getToken() {
        return token;
    }

    public String getPayload() {
        return payload;
    }

    public String getExpiresAt() {
        return expiresAt;
    }
}
