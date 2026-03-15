package aucasa.com.rw.dto.attendance;

public class AttendanceRecordResponse {
    private Long id;
    private String date;
    private String location;
    private String time;
    private String method;
    private String status;
    private String verificationStatus;
    private String wifiSsid;

    public AttendanceRecordResponse(Long id, String date, String location, String time, String method, String status, String verificationStatus, String wifiSsid) {
        this.id = id;
        this.date = date;
        this.location = location;
        this.time = time;
        this.method = method;
        this.status = status;
        this.verificationStatus = verificationStatus;
        this.wifiSsid = wifiSsid;
    }

    public Long getId() {
        return id;
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
}
