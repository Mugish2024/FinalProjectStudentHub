package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.AttendanceMethod;
import aucasa.com.rw.domain.enums.AttendanceStatus;
import aucasa.com.rw.domain.enums.AttendanceVerificationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
public class AttendanceRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @Column
    private LocalDateTime checkInAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AttendanceMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status = AttendanceStatus.ABSENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceVerificationStatus verificationStatus = AttendanceVerificationStatus.PENDING;

    @Column(length = 500)
    private String notes;

    @Column(length = 120)
    private String wifiSsid;

    @Column(length = 120)
    private String deviceInfo;

    @Column(length = 80)
    private String ipAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private UserAccount verifiedBy;

    @Column
    private LocalDateTime verifiedAt;

    @Column(length = 800)
    private String verificationNotes;

    public AttendanceSession getSession() {
        return session;
    }

    public void setSession(AttendanceSession session) {
        this.session = session;
    }

    public StudentProfile getStudent() {
        return student;
    }

    public void setStudent(StudentProfile student) {
        this.student = student;
    }

    public LocalDateTime getCheckInAt() {
        return checkInAt;
    }

    public void setCheckInAt(LocalDateTime checkInAt) {
        this.checkInAt = checkInAt;
    }

    public AttendanceMethod getMethod() {
        return method;
    }

    public void setMethod(AttendanceMethod method) {
        this.method = method;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public AttendanceVerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(AttendanceVerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public UserAccount getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(UserAccount verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getVerificationNotes() {
        return verificationNotes;
    }

    public void setVerificationNotes(String verificationNotes) {
        this.verificationNotes = verificationNotes;
    }
}
