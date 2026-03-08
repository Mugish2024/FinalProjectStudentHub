package aucasa.com.rw.config;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.Campus;
import aucasa.com.rw.domain.Faculty;
import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AccountStatus;
import aucasa.com.rw.domain.enums.DisciplineStatus;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.CampusRepository;
import aucasa.com.rw.repository.FacultyRepository;
import aucasa.com.rw.repository.RoleRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final CampusRepository campusRepository;
    private final FacultyRepository facultyRepository;
    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final AcademicTermRepository academicTermRepository;

    public DemoDataInitializer(
            RoleRepository roleRepository,
            CampusRepository campusRepository,
            FacultyRepository facultyRepository,
            UserAccountRepository userAccountRepository,
            StudentProfileRepository studentProfileRepository,
            AcademicTermRepository academicTermRepository
    ) {
        this.roleRepository = roleRepository;
        this.campusRepository = campusRepository;
        this.facultyRepository = facultyRepository;
        this.userAccountRepository = userAccountRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.academicTermRepository = academicTermRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedActiveTermIfMissing();
        seedStudentIfMissing();
    }

    private void seedActiveTermIfMissing() {
        if (academicTermRepository.findByActiveTrue().isPresent()) {
            return;
        }

        AcademicTerm term = new AcademicTerm();
        term.setName("Harmattan 2026");
        term.setAcademicYear("2025/2026");
        term.setSemesterNumber(2);
        term.setStartDate(LocalDate.now().minusMonths(1));
        term.setEndDate(LocalDate.now().plusMonths(4));
        term.setActive(true);
        academicTermRepository.save(term);
    }

    private void seedStudentIfMissing() {
        if (studentProfileRepository.count() > 0) {
            return;
        }

        Role studentRole = roleRepository.findByName(RoleType.STUDENT).orElseGet(() -> {
            Role role = new Role();
            role.setName(RoleType.STUDENT);
            return roleRepository.save(role);
        });

        Campus campus = campusRepository.findByCode("MAS").orElseGet(() -> {
            Campus c = new Campus();
            c.setCode("MAS");
            c.setName("Masoro Campus");
            return campusRepository.save(c);
        });

        Faculty faculty = facultyRepository.findByCode("IT").orElseGet(() -> {
            Faculty f = new Faculty();
            f.setCode("IT");
            f.setName("Information Technology");
            return facultyRepository.save(f);
        });

        UserAccount user = new UserAccount();
        user.setUsername("student1");
        user.setEmail("student1@auca.ac.rw");
        user.setPasswordHash("demo-password-hash");
        user.setFirstName("Demo");
        user.setLastName("Student");
        user.setRole(studentRole);
        user.setStatus(AccountStatus.ACTIVE);
        user = userAccountRepository.save(user);

        StudentProfile student = new StudentProfile();
        student.setUserAccount(user);
        student.setStudentNumber("AUCA/TEST/001");
        student.setCampus(campus);
        student.setFaculty(faculty);
        student.setGpa(new BigDecimal("15.50"));
        student.setSemester(4);
        student.setDisciplineScore(75);
        student.setDisciplineStatus(DisciplineStatus.SATISFACTORY);
        studentProfileRepository.save(student);
    }
}
