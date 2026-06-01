package aucasa.com.rw.dto.user;

public class UserDirectoryItem {
    private Long id;
    private String fullName;
    private String role;
    private String studentNumber;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String disciplineStatus;

    public UserDirectoryItem(Long id, String fullName, String role, String studentNumber) {
        this(id, fullName, role, studentNumber, null, null, null, null, null);
    }

    public UserDirectoryItem(Long id,
                             String fullName,
                             String role,
                             String studentNumber,
                             String username,
                             String email,
                             String firstName,
                             String lastName) {
        this(id, fullName, role, studentNumber, username, email, firstName, lastName, null);
    }

    public UserDirectoryItem(Long id,
                             String fullName,
                             String role,
                             String studentNumber,
                             String username,
                             String email,
                             String firstName,
                             String lastName,
                             String disciplineStatus) {
        this.id = id;
        this.fullName = fullName;
        this.role = role;
        this.studentNumber = studentNumber;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.disciplineStatus = disciplineStatus;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getRole() {
        return role;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getDisciplineStatus() {
        return disciplineStatus;
    }
}
