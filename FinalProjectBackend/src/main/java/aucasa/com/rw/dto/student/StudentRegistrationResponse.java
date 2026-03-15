package aucasa.com.rw.dto.student;

public class StudentRegistrationResponse {
    private Long studentId;
    private String studentNumber;
    private String fullName;
    private String faculty;
    private String department;
    private String program;
    private Integer credits;

    public StudentRegistrationResponse(Long studentId, String studentNumber, String fullName, String faculty, String department, String program, Integer credits) {
        this.studentId = studentId;
        this.studentNumber = studentNumber;
        this.fullName = fullName;
        this.faculty = faculty;
        this.department = department;
        this.program = program;
        this.credits = credits;
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

    public String getProgram() {
        return program;
    }

    public Integer getCredits() {
        return credits;
    }
}
