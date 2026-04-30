package aucasa.com.rw.dto.attendance;

public class AttendanceCheckInRequest {
    private String studentNumber;
    private Long sessionId;
    private String method;
    private String wifiSsid;
    private String deviceInfo;
    private String qrToken;
    private Double latitude;
    private Double longitude;
    private Double locationAccuracyMeters;
    private Boolean mockLocation;
    private Boolean biometricVerified;
    private String biometricVerifiedAt;
    private String biometricProvider;

    public String getStudentNumber() {
        return studentNumber;
    }

    public void setStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getWifiSsid() {
        return wifiSsid;
    }

    public void setWifiSsid(String wifiSsid) {
        this.wifiSsid = wifiSsid;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getLocationAccuracyMeters() {
        return locationAccuracyMeters;
    }

    public void setLocationAccuracyMeters(Double locationAccuracyMeters) {
        this.locationAccuracyMeters = locationAccuracyMeters;
    }

    public Boolean getMockLocation() {
        return mockLocation;
    }

    public void setMockLocation(Boolean mockLocation) {
        this.mockLocation = mockLocation;
    }

    public Boolean getBiometricVerified() {
        return biometricVerified;
    }

    public void setBiometricVerified(Boolean biometricVerified) {
        this.biometricVerified = biometricVerified;
    }

    public String getBiometricVerifiedAt() {
        return biometricVerifiedAt;
    }

    public void setBiometricVerifiedAt(String biometricVerifiedAt) {
        this.biometricVerifiedAt = biometricVerifiedAt;
    }

    public String getBiometricProvider() {
        return biometricProvider;
    }

    public void setBiometricProvider(String biometricProvider) {
        this.biometricProvider = biometricProvider;
    }
}
