package aucasa.com.rw.dto.attendance;

public class AttendanceRecordResponse {
    private Long id;
    private Long sessionId;
    private String date;
    private String location;
    private String time;
    private String method;
    private String status;
    private String verificationStatus;
    private String wifiSsid;
    private String absenceReason;
    private String absenceDocumentName;
    private Boolean hasAbsenceDocument;

    public AttendanceRecordResponse(
            Long id,
            Long sessionId,
            String date,
            String location,
            String time,
            String method,
            String status,
            String verificationStatus,
            String wifiSsid,
            String absenceReason,
            String absenceDocumentName,
            Boolean hasAbsenceDocument
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.date = date;
        this.location = location;
        this.time = time;
        this.method = method;
        this.status = status;
        this.verificationStatus = verificationStatus;
        this.wifiSsid = wifiSsid;
        this.absenceReason = absenceReason;
        this.absenceDocumentName = absenceDocumentName;
        this.hasAbsenceDocument = hasAbsenceDocument;
    }

    public Long getId() {
        return id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public String getDate() {
        return date;
    }

    public String getLocation() {
        return location;
    }

    public String getTime() {
        return time;
    }

    public String getMethod() {
        return method;
    }

    public String getStatus() {
        return status;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public String getWifiSsid() {
        return wifiSsid;
    }

    public String getAbsenceReason() {
        return absenceReason;
    }

    public String getAbsenceDocumentName() {
        return absenceDocumentName;
    }

    public Boolean getHasAbsenceDocument() {
        return hasAbsenceDocument;
    }
}
