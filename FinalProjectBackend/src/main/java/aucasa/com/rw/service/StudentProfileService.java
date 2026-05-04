package aucasa.com.rw.service;

import aucasa.com.rw.domain.Campus;
import aucasa.com.rw.domain.Department;
import aucasa.com.rw.domain.Faculty;
import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AccountStatus;
import aucasa.com.rw.domain.enums.DisciplineStatus;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.dto.student.StudentRegistrationRequest;
import aucasa.com.rw.dto.student.StudentRegistrationResponse;
import aucasa.com.rw.repository.CampusRepository;
import aucasa.com.rw.repository.DepartmentRepository;
import aucasa.com.rw.repository.FacultyRepository;
import aucasa.com.rw.repository.RoleRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentProfileService {
    private final StudentProfileRepository repository;
    private final UserAccountRepository userAccountRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final CampusRepository campusRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentProfileService(
            StudentProfileRepository repository,
            UserAccountRepository userAccountRepository,
            FacultyRepository facultyRepository,
            DepartmentRepository departmentRepository,
            CampusRepository campusRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.userAccountRepository = userAccountRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.campusRepository = campusRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<StudentProfile> findAll() { return repository.findAll(); }
    public Optional<StudentProfile> findById(Long id) { return repository.findById(id); }
    public StudentProfile create(StudentProfile entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
    public Optional<StudentRegistrationResponse> findSummaryByStudentNumber(String studentNumber) {
        if (isBlank(studentNumber)) {
            return Optional.empty();
        }
        return repository.findByStudentNumber(studentNumber.trim()).map(this::toRegistrationResponse);
    }

    public List<StudentRegistrationResponse> findAllSummaries() {
        List<StudentProfile> students = repository.findAll();
        List<StudentRegistrationResponse> result = new ArrayList<>();
        for (StudentProfile student : students) {
            result.add(toRegistrationResponse(student));
        }
        return result;
    }

    @Transactional
    public List<StudentRegistrationResponse> createDemoStudents() {
        List<StudentRegistrationResponse> created = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            StudentRegistrationRequest request = new StudentRegistrationRequest();
            request.setStudentNumber("DEMO/UG/2026/0" + i);
            request.setFirstName("Demo" + i);
            request.setLastName("Student");
            request.setFaculty("Information Technology");
            request.setDepartment("Software Engineering");
            request.setProgram("Day");
            request.setCredits(12);
            request.setSemester(1);
            request.setGpa(0.0);
            created.add(registerStudent(request));
        }
        return created;
    }

    @Transactional
    public StudentRegistrationResponse registerStudent(StudentRegistrationRequest request) {
        validateRequest(request);

        Optional<StudentProfile> existing = repository.findByStudentNumber(request.getStudentNumber().trim());
        if (existing.isPresent()) {
            StudentProfile student = existing.get();
            return new StudentRegistrationResponse(
                    student.getId(),
                    student.getStudentNumber(),
                    student.getUserAccount().getFirstName() + " " + student.getUserAccount().getLastName(),
                    student.getFaculty().getName(),
                    student.getDepartment() != null ? student.getDepartment().getName() : "",
                    normalizeProgram(student.getProgram()),
                    normalizeCredits(student.getCredits()),
                    normalizeSemester(student.getSemester()),
                    normalizeGpa(student.getGpa()).doubleValue()
            );
        }

        Faculty faculty = facultyRepository.findByNameIgnoreCase(request.getFaculty().trim())
                .orElseGet(() -> createFaculty(request.getFaculty().trim()));

        Department department = departmentRepository.findByFacultyIdAndNameIgnoreCase(faculty.getId(), request.getDepartment().trim())
                .orElseGet(() -> createDepartment(faculty, request.getDepartment().trim()));

        Campus campus = campusRepository.findByCode("MAS")
                .orElseGet(() -> createCampus("MAS", "Masoro Campus"));

        Role studentRole = roleRepository.findByName(RoleType.STUDENT)
                .orElseGet(this::createStudentRole);

        String normalizedStudentNumber = request.getStudentNumber().trim();
        String username = normalizedStudentNumber.toLowerCase().replaceAll("[^a-z0-9]", "");
        String email = username + "@auca.ac.rw";

        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("set-password-later"));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setRole(studentRole);
        user.setStatus(AccountStatus.ACTIVE);
        user = userAccountRepository.save(user);

        StudentProfile student = new StudentProfile();
        student.setUserAccount(user);
        student.setStudentNumber(normalizedStudentNumber);
        student.setFaculty(faculty);
        student.setDepartment(department);
        student.setCampus(campus);
        student.setGpa(normalizeGpa(request.getGpa() != null ? BigDecimal.valueOf(request.getGpa()) : null));
        student.setSemester(normalizeSemester(request.getSemester()));
        student.setDisciplineScore(0);
        student.setDisciplineStatus(DisciplineStatus.SATISFACTORY);
        student.setProgram(normalizeProgram(request.getProgram()));
        student.setCredits(normalizeCredits(request.getCredits()));
        student = repository.save(student);

        return new StudentRegistrationResponse(
                student.getId(),
                student.getStudentNumber(),
                user.getFirstName() + " " + user.getLastName(),
                faculty.getName(),
                department.getName(),
                normalizeProgram(student.getProgram()),
                normalizeCredits(student.getCredits()),
                normalizeSemester(student.getSemester()),
                normalizeGpa(student.getGpa()).doubleValue()
        );
    }

    @Transactional
    public StudentRegistrationResponse updateStudent(Long id, StudentRegistrationRequest request) {
        validateRequest(request);
        StudentProfile student = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        Faculty faculty = facultyRepository.findByNameIgnoreCase(request.getFaculty().trim())
                .orElseGet(() -> createFaculty(request.getFaculty().trim()));
        Department department = departmentRepository.findByFacultyIdAndNameIgnoreCase(faculty.getId(), request.getDepartment().trim())
                .orElseGet(() -> createDepartment(faculty, request.getDepartment().trim()));

        UserAccount user = student.getUserAccount();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        userAccountRepository.save(user);

        student.setStudentNumber(request.getStudentNumber().trim());
        student.setFaculty(faculty);
        student.setDepartment(department);
        student.setProgram(normalizeProgram(request.getProgram()));
        student.setCredits(normalizeCredits(request.getCredits()));
        student.setSemester(normalizeSemester(request.getSemester()));
        student.setGpa(normalizeGpa(request.getGpa() != null ? BigDecimal.valueOf(request.getGpa()) : null));
        student = repository.save(student);

        return toRegistrationResponse(student);
    }

    @Transactional
    private void validateRequest(StudentRegistrationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        if (isBlank(request.getStudentNumber()) || isBlank(request.getFirstName()) || isBlank(request.getLastName())
                || isBlank(request.getFaculty()) || isBlank(request.getDepartment())) {
            throw new IllegalArgumentException("studentNumber, firstName, lastName, faculty and department are required.");
        }
    }

    private Faculty createFaculty(String name) {
        Faculty faculty = new Faculty();
        faculty.setName(name);
        faculty.setCode(generateCode(name, "FAC"));
        return facultyRepository.save(faculty);
    }

    private Department createDepartment(Faculty faculty, String name) {
        Department department = new Department();
        department.setName(name);
        department.setCode(generateCode(name, "DEP"));
        department.setFaculty(faculty);
        department.setCampus(null);
        return departmentRepository.save(department);
    }

    private Campus createCampus(String code, String name) {
        Campus campus = new Campus();
        campus.setCode(code);
        campus.setName(name);
        return campusRepository.save(campus);
    }

    private Role createStudentRole() {
        Role role = new Role();
        role.setName(RoleType.STUDENT);
        return roleRepository.save(role);
    }

    private String generateCode(String text, String fallbackPrefix) {
        String lettersOnly = text.toUpperCase().replaceAll("[^A-Z]", "");
        String base = lettersOnly.length() >= 3 ? lettersOnly.substring(0, 3) : fallbackPrefix;
        return base + System.currentTimeMillis() % 100000;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String normalizeProgram(String program) {
        if (isBlank(program)) {
            return "Day";
        }
        return program.trim();
    }

    private Integer normalizeCredits(Integer credits) {
        if (credits == null || credits < 0) {
            return 0;
        }
        return credits;
    }

    private Integer normalizeSemester(Integer semester) {
        if (semester == null || semester < 1) {
            return 1;
        }
        return semester;
    }

    private BigDecimal normalizeGpa(BigDecimal gpa) {
        if (gpa == null) {
            return new BigDecimal("0.00");
        }
        BigDecimal normalized = gpa.max(BigDecimal.ZERO).min(new BigDecimal("5.00"));
        return normalized.setScale(2, RoundingMode.HALF_UP);
    }

    private StudentRegistrationResponse toRegistrationResponse(StudentProfile student) {
        String faculty = student.getFaculty() != null ? student.getFaculty().getName() : "";
        String department = student.getDepartment() != null ? student.getDepartment().getName() : "";
        String program = normalizeProgram(student.getProgram());
        Integer credits = normalizeCredits(student.getCredits());
        String fullName = student.getUserAccount().getFirstName() + " " + student.getUserAccount().getLastName();

        return new StudentRegistrationResponse(
                student.getId(),
                student.getStudentNumber(),
                fullName,
                faculty,
                department,
                program,
                credits,
                normalizeSemester(student.getSemester()),
                normalizeGpa(student.getGpa()).doubleValue()
        );
    }
}
