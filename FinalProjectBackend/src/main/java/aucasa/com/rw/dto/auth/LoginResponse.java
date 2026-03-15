package aucasa.com.rw.dto.auth;

public class LoginResponse {
    private String fullName;
    private String studentNumber;
    private String faculty;
    private String department;
    private String program;
    private Integer credits;
    private String role;

    public LoginResponse(
            String fullName,
            String studentNumber,
            String faculty,
            String department,
            String program,
            Integer credits,
            String role
    ) {
        this.fullName = fullName;
        this.studentNumber = studentNumber;
        this.faculty = faculty;
        this.department = department;
        this.program = program;
        this.credits = credits;
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public String getStudentNumber() {
        return studentNumber;
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

    public String getRole() {
        return role;
    }
}
