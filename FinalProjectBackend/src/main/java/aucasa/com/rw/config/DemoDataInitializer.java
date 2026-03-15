package aucasa.com.rw.config;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.AttendanceSession;
import aucasa.com.rw.domain.Campus;
import aucasa.com.rw.domain.Faculty;
import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AccountStatus;
import aucasa.com.rw.domain.enums.DisciplineStatus;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.AttendanceSessionRepository;
import aucasa.com.rw.repository.CampusRepository;
import aucasa.com.rw.repository.FacultyRepository;
import aucasa.com.rw.repository.RoleRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(
            RoleRepository roleRepository,
            CampusRepository campusRepository,
            FacultyRepository facultyRepository,
            UserAccountRepository userAccountRepository,
            StudentProfileRepository studentProfileRepository,
            AcademicTermRepository academicTermRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.campusRepository = campusRepository;
        this.facultyRepository = facultyRepository;
        this.userAccountRepository = userAccountRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.academicTermRepository = academicTermRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedActiveTermIfMissing();
        seedStudentIfMissing();
        seedDeanIfMissing();
        seedAttendanceSessionsIfMissing();
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
        user.setPasswordHash(passwordEncoder.encode("demo123"));
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
        student.setProgram("Day");
        student.setCredits(15);
        studentProfileRepository.save(student);
    }

    private void seedDeanIfMissing() {
        String deanUsername = "dean1";
        String deanEmail = "dean1@auca.ac.rw";

        if (userAccountRepository.findByUsername(deanUsername).isPresent()
                || userAccountRepository.findByEmail(deanEmail).isPresent()) {
            return;
        }

        Role deanRole = roleRepository.findByName(RoleType.DEAN).orElseGet(() -> {
            Role role = new Role();
            role.setName(RoleType.DEAN);
            return roleRepository.save(role);
        });

        UserAccount dean = new UserAccount();
        dean.setUsername(deanUsername);
        dean.setEmail(deanEmail);
        dean.setPasswordHash(passwordEncoder.encode("dean123"));
        dean.setFirstName("Demo");
        dean.setLastName("Dean");
        dean.setRole(deanRole);
        dean.setStatus(AccountStatus.ACTIVE);
        userAccountRepository.save(dean);
    }

    private void seedAttendanceSessionsIfMissing() {
        if (attendanceSessionRepository.count() > 0) {
            return;
        }

        AcademicTerm term = academicTermRepository.findByActiveTrue()
                .orElseGet(() -> {
                    AcademicTerm t = new AcademicTerm();
                    t.setName("Harmattan 2026");
                    t.setAcademicYear("2025/2026");
                    t.setSemesterNumber(2);
                    t.setStartDate(LocalDate.now().minusMonths(1));
                    t.setEndDate(LocalDate.now().plusMonths(4));
                    t.setActive(true);
                    return academicTermRepository.save(t);
                });

        Campus masoro = campusRepository.findByCode("MAS").orElseGet(() -> {
            Campus c = new Campus();
            c.setCode("MAS");
            c.setName("Masoro Campus");
            return campusRepository.save(c);
        });

        Campus gishushu = campusRepository.findByCode("GIS").orElseGet(() -> {
            Campus c = new Campus();
            c.setCode("GIS");
            c.setName("Gishushu Campus");
            return campusRepository.save(c);
        });

        AttendanceSession activeSession = new AttendanceSession();
        activeSession.setTitle("Gishushu General Assembly");
        activeSession.setCampus(gishushu);
        activeSession.setTerm(term);
        activeSession.setStartsAt(LocalDateTime.now().minusMinutes(30));
        activeSession.setEndsAt(LocalDateTime.now().plusHours(2));
        activeSession.setActive(true);
        attendanceSessionRepository.save(activeSession);

        AttendanceSession upcomingSession = new AttendanceSession();
        upcomingSession.setTitle("Masoro General Assembly");
        upcomingSession.setCampus(masoro);
        upcomingSession.setTerm(term);
        upcomingSession.setStartsAt(LocalDateTime.now().plusDays(2).withHour(14).withMinute(0));
        upcomingSession.setEndsAt(LocalDateTime.now().plusDays(2).withHour(16).withMinute(0));
        upcomingSession.setActive(false);
        attendanceSessionRepository.save(upcomingSession);
    }
}
