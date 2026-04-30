package aucasa.com.rw.dto.auth;

public class LoginResponse {
    private Long userId;
    private Long studentId;
    private String username;
    private String fullName;
    private String studentNumber;
    private String faculty;
    private String department;
    private String program;
    private Integer credits;
    private String role;
    private String gpa;
    private Integer semester;
    private String disciplineStatus;

    public LoginResponse(
            Long userId,
            Long studentId,
            String username,
            String fullName,
            String studentNumber,
            String faculty,
            String department,
            String program,
            Integer credits,
            String role,
            String gpa,
            Integer semester,
            String disciplineStatus
    ) {
        this.userId = userId;
        this.studentId = studentId;
        this.username = username;
        this.fullName = fullName;
        this.studentNumber = studentNumber;
        this.faculty = faculty;
        this.department = department;
        this.program = program;
        this.credits = credits;
        this.role = role;
        this.gpa = gpa;
        this.semester = semester;
        this.disciplineStatus = disciplineStatus;
    }

    public String getFullName() {
        return fullName;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getUsername() {
        return username;
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

    public String getGpa() {
        return gpa;
    }

    public Integer getSemester() {
        return semester;
    }

    public String getDisciplineStatus() {
        return disciplineStatus;
    }
}
