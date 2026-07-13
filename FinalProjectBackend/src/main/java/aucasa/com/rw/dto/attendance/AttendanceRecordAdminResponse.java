package aucasa.com.rw.dto.attendance;

public class AttendanceRecordAdminResponse {
    private Long id;
    private Long sessionId;
    private String studentName;
    private String studentNumber;
    private String sessionTitle;
    private String campus;
    private String checkInAt;
    private String method;
    private String status;
    private String verificationStatus;
    private String wifiSsid;
    private String ipAddress;
    private String deviceInfo;
    private String absenceReason;
    private String absenceDocumentName;
    private Boolean hasAbsenceDocument;

    public AttendanceRecordAdminResponse(
            Long id,
            Long sessionId,
            String studentName,
            String studentNumber,
            String sessionTitle,
            String campus,
            String checkInAt,
            String method,
            String status,
            String verificationStatus,
            String wifiSsid,
            String ipAddress,
            String deviceInfo,
            String absenceReason,
            String absenceDocumentName,
            Boolean hasAbsenceDocument
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.studentName = studentName;
        this.studentNumber = studentNumber;
        this.sessionTitle = sessionTitle;
        this.campus = campus;
        this.checkInAt = checkInAt;
        this.method = method;
        this.status = status;
        this.verificationStatus = verificationStatus;
        this.wifiSsid = wifiSsid;
        this.ipAddress = ipAddress;
        this.deviceInfo = deviceInfo;
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

    public String getStudentName() {
        return studentName;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getSessionTitle() {
        return sessionTitle;
    }

    public String getCampus() {
        return campus;
    }

    public String getCheckInAt() {
        return checkInAt;
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

    public String getIpAddress() {
        return ipAddress;
    }

    public String getDeviceInfo() {
        return deviceInfo;
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
