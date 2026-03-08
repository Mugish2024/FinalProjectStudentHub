package aucasa.com.rw.dto.student;

public class StudentRegistrationResponse {
    private Long studentId;
    private String studentNumber;
    private String fullName;
    private String faculty;
    private String department;

    public StudentRegistrationResponse(Long studentId, String studentNumber, String fullName, String faculty, String department) {
        this.studentId = studentId;
        this.studentNumber = studentNumber;
        this.fullName = fullName;
        this.faculty = faculty;
        this.department = department;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public String getFaculty() {
        return faculty;
    }

    public String getDepartment() {
        return department;
    }
}
