package aucasa.com.rw.dto.student;

public class StudentRegistrationResponse {
    private Long studentId;
    private String studentNumber;
    private String fullName;
    private String faculty;
    private String department;
    private String program;
    private Integer credits;
    private Integer semester;
    private Double gpa;

    public StudentRegistrationResponse(Long studentId, String studentNumber, String fullName, String faculty, String department, String program, Integer credits, Integer semester, Double gpa) {
        this.studentId = studentId;
        this.studentNumber = studentNumber;
        this.fullName = fullName;
        this.faculty = faculty;
        this.department = department;
        this.program = program;
        this.credits = credits;
        this.semester = semester;
        this.gpa = gpa;
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

    public Integer getSemester() {
        return semester;
    }

    public Double getGpa() {
        return gpa;
    }
}
