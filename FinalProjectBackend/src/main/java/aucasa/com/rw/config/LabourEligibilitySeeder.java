package aucasa.com.rw.config;

import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.enums.DisciplineStatus;
import aucasa.com.rw.dto.student.StudentRegistrationRequest;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.service.StudentProfileService;
import java.math.BigDecimal;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LabourEligibilitySeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(LabourEligibilitySeeder.class);
    private static final String TARGET_STUDENT_NUMBER = "26330";

    private final StudentProfileRepository studentProfileRepository;
    private final StudentProfileService studentProfileService;

    public LabourEligibilitySeeder(
            StudentProfileRepository studentProfileRepository,
            StudentProfileService studentProfileService
    ) {
        this.studentProfileRepository = studentProfileRepository;
        this.studentProfileService = studentProfileService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        StudentProfile student = ensureStudentExists();

        // Labour eligibility rule target: semester >= 3, GPA >= 14, discipline SATISFACTORY
        student.setSemester(4);
        student.setGpa(new BigDecimal("16.50"));
        student.setDisciplineStatus(DisciplineStatus.SATISFACTORY);
        student.setDisciplineScore(0);
        studentProfileRepository.save(student);

        log.info("Labour eligibility seeded for studentNumber={}", TARGET_STUDENT_NUMBER);
    }

    private StudentProfile ensureStudentExists() {
        Optional<StudentProfile> existing = studentProfileRepository.findByStudentNumber(TARGET_STUDENT_NUMBER);
        if (existing.isPresent()) {
            return existing.get();
        }

        StudentRegistrationRequest request = new StudentRegistrationRequest();
        request.setStudentNumber(TARGET_STUDENT_NUMBER);
        request.setFirstName("Eligible");
        request.setLastName("Student");
        request.setFaculty("Information Technology");
        request.setDepartment("Software Engineering");
        request.setProgram("Day");
        request.setCredits(60);
        studentProfileService.registerStudent(request);

        return studentProfileRepository.findByStudentNumber(TARGET_STUDENT_NUMBER)
                .orElseThrow(() -> new IllegalStateException("Failed to create seed student 26330"));
    }
}
