package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.LabourLogStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "labour_daily_logs")
public class LabourDailyLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private LabourApplication application;

    @Column(nullable = false)
    private LocalDate logDate;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal hoursWorked;

    @Column
    private LocalTime workStartTime;

    @Column
    private LocalTime workEndTime;

    @Column(nullable = false, length = 1500)
    private String taskDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LabourLogStatus status = LabourLogStatus.PENDING_REVIEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private UserAccount verifiedBy;

    @Column
    private LocalDateTime verifiedAt;

    @Column(length = 800)
    private String verificationNote;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(nullable = false)
    private Boolean locationValidated = Boolean.FALSE;

    @Column(length = 500)
    private String lateSubmissionReason;

    public LabourApplication getApplication() {
        return application;
    }

    public void setApplication(LabourApplication application) {
        this.application = application;
    }

    public LocalDate getLogDate() {
        return logDate;
    }

    public void setLogDate(LocalDate logDate) {
        this.logDate = logDate;
    }

    public BigDecimal getHoursWorked() {
        return hoursWorked;
    }

    public void setHoursWorked(BigDecimal hoursWorked) {
        this.hoursWorked = hoursWorked;
    }

    public LocalTime getWorkStartTime() {
        return workStartTime;
    }

    public void setWorkStartTime(LocalTime workStartTime) {
        this.workStartTime = workStartTime;
    }

    public LocalTime getWorkEndTime() {
        return workEndTime;
    }

    public void setWorkEndTime(LocalTime workEndTime) {
        this.workEndTime = workEndTime;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }

    public LabourLogStatus getStatus() {
        return status;
    }

    public void setStatus(LabourLogStatus status) {
        this.status = status;
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

    public String getVerificationNote() {
        return verificationNote;
    }

    public void setVerificationNote(String verificationNote) {
        this.verificationNote = verificationNote;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public Boolean getLocationValidated() {
        return locationValidated;
    }

    public void setLocationValidated(Boolean locationValidated) {
        this.locationValidated = locationValidated;
    }

    public String getLateSubmissionReason() {
        return lateSubmissionReason;
    }

    public void setLateSubmissionReason(String lateSubmissionReason) {
        this.lateSubmissionReason = lateSubmissionReason;
    }
}
