package aucasa.com.rw.service;

import aucasa.com.rw.domain.RegistrationRecord;
import aucasa.com.rw.dto.student.StudentCourseEnrollmentResponse;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.RegistrationRecordRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class RegistrationRecordService {
    private final RegistrationRecordRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final AcademicTermRepository academicTermRepository;

    public RegistrationRecordService(
            RegistrationRecordRepository repository,
            StudentProfileRepository studentProfileRepository,
            AcademicTermRepository academicTermRepository
    ) {
        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.academicTermRepository = academicTermRepository;
    }

    public List<RegistrationRecord> findAll() { return repository.findAll(); }
    public Optional<RegistrationRecord> findById(Long id) { return repository.findById(id); }
    public RegistrationRecord create(RegistrationRecord entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }

    public List<StudentCourseEnrollmentResponse> findCurrentTermCoursesByStudentNumber(String studentNumber) {
        if (studentNumber == null || studentNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("studentNumber is required.");
        }

        Long studentId = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."))
                .getId();

        List<RegistrationRecord> studentRegistrations = repository.findByStudentId(studentId);

        Optional<Long> activeTermId = academicTermRepository.findByActiveTrue().map(term -> term.getId());

        return studentRegistrations.stream()
                .filter(record -> activeTermId.map(termId -> record.getTerm() != null && termId.equals(record.getTerm().getId())).orElse(true))
                .sorted(Comparator.comparing(RegistrationRecord::getCreatedAt).reversed())
                .map(this::toCourseEnrollmentResponse)
                .toList();
    }

    private StudentCourseEnrollmentResponse toCourseEnrollmentResponse(RegistrationRecord record) {
        String code = record.getCourseGroup() != null && record.getCourseGroup().getCourse() != null
                ? safe(record.getCourseGroup().getCourse().getCode()) : "";
        String title = record.getCourseGroup() != null && record.getCourseGroup().getCourse() != null
                ? safe(record.getCourseGroup().getCourse().getTitle()) : "";
        Integer credits = record.getCourseGroup() != null && record.getCourseGroup().getCourse() != null
                ? record.getCourseGroup().getCourse().getCredits() : 0;
        String groupName = record.getCourseGroup() != null ? safe(record.getCourseGroup().getGroupName()) : "";
        String status = record.getStatus() != null ? record.getStatus().name() : "PENDING";
        String termName = record.getTerm() != null ? safe(record.getTerm().getName()) : "";

        return new StudentCourseEnrollmentResponse(
                record.getId(),
                code,
                title,
                credits,
                groupName,
                status,
                termName
        );
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
