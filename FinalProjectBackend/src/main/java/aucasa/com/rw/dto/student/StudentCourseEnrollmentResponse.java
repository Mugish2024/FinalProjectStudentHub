package aucasa.com.rw.dto.student;

public class StudentCourseEnrollmentResponse {
    private Long registrationId;
    private String courseCode;
    private String courseTitle;
    private Integer courseCredits;
    private String groupName;
    private String status;
    private String termName;

    public StudentCourseEnrollmentResponse(
            Long registrationId,
            String courseCode,
            String courseTitle,
            Integer courseCredits,
            String groupName,
            String status,
            String termName
    ) {
        this.registrationId = registrationId;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.courseCredits = courseCredits;
        this.groupName = groupName;
        this.status = status;
        this.termName = termName;
    }

    public Long getRegistrationId() {
        return registrationId;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public Integer getCourseCredits() {
        return courseCredits;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getStatus() {
        return status;
    }

    public String getTermName() {
        return termName;
    }
}

