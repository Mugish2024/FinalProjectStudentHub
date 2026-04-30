package aucasa.com.rw.dto.labour;

import java.time.LocalDate;

public class LabourDailyLogResponse {
    private Long id;
    private String studentName;
    private String department;
    private LocalDate logDate;
    private String hoursWorked;
    private String taskDescription;
    private String status;
    private Boolean locationValidated;
    private String lateSubmissionReason;

    public LabourDailyLogResponse(
            Long id,
            String studentName,
            String department,
            LocalDate logDate,
            String hoursWorked,
            String taskDescription,
            String status,
            Boolean locationValidated,
            String lateSubmissionReason
    ) {
        this.id = id;
        this.studentName = studentName;
        this.department = department;
        this.logDate = logDate;
        this.hoursWorked = hoursWorked;
        this.taskDescription = taskDescription;
        this.status = status;
        this.locationValidated = locationValidated;
        this.lateSubmissionReason = lateSubmissionReason;
    }

    public Long getId() {
        return id;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getDepartment() {
        return department;
    }

    public LocalDate getLogDate() {
        return logDate;
    }

    public String getHoursWorked() {
        return hoursWorked;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public String getStatus() {
        return status;
    }

    public Boolean getLocationValidated() {
        return locationValidated;
    }

    public String getLateSubmissionReason() {
        return lateSubmissionReason;
    }
}
