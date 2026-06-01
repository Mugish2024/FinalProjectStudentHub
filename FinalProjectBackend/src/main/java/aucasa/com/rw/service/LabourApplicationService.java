package aucasa.com.rw.service;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.Department;
import aucasa.com.rw.domain.LabourApplication;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.LabourApplicationStatus;
import aucasa.com.rw.dto.labour.LabourApplicationResponse;
import aucasa.com.rw.dto.labour.LabourApplicationReviewRequest;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.DepartmentRepository;
import aucasa.com.rw.repository.LabourApplicationRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LabourApplicationService {
    private final LabourApplicationRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final DepartmentRepository departmentRepository;
    private final AcademicTermRepository academicTermRepository;
    private final UserAccountRepository userAccountRepository;
    private final Path labourUploadDir;

    public LabourApplicationService(
            LabourApplicationRepository repository,
            StudentProfileRepository studentProfileRepository,
            DepartmentRepository departmentRepository,
            AcademicTermRepository academicTermRepository,
            UserAccountRepository userAccountRepository,
            @Value("${app.storage.labour-upload-dir:}") String uploadDir
    ) {
        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.departmentRepository = departmentRepository;
        this.academicTermRepository = academicTermRepository;
        this.userAccountRepository = userAccountRepository;
        this.labourUploadDir = resolveUploadDir(uploadDir);
    }

    @Transactional(readOnly = true)
    public List<LabourApplicationResponse> listApplications(String status, String department, String studentNumber) {
        List<LabourApplication> applications = new ArrayList<>();

        if (studentNumber != null && !studentNumber.isBlank()) {
            applications.addAll(repository.findByStudentStudentNumber(studentNumber.trim()));
        } else if (status != null && !status.isBlank() && department != null && !department.isBlank()) {
            LabourApplicationStatus parsed = parseStatus(status);
            applications.addAll(repository.findByStatusAndDepartmentNameIgnoreCase(parsed, department.trim()));
        } else if (status != null && !status.isBlank()) {
            LabourApplicationStatus parsed = parseStatus(status);
            applications.addAll(repository.findByStatus(parsed));
        } else {
            applications.addAll(repository.findAll());
        }

        return applications.stream().map(this::toResponse).toList();
    }

    @Transactional
    public LabourApplicationResponse submitApplication(
            String studentNumber,
            String departmentName,
            String roleTitle,
            String coverLetterText,
            MultipartFile coverLetterFile,
            MultipartFile transcriptFile
    ) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }

        StudentProfile student = studentProfileRepository
                .findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        AcademicTerm term = academicTermRepository.findByActiveTrue()
                .orElseThrow(() -> new IllegalArgumentException("Active academic term not found."));

        String resolvedDepartmentName = resolveDepartmentName(student, departmentName);
        Department department = departmentRepository.findByNameIgnoreCase(resolvedDepartmentName)
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setName(resolvedDepartmentName);
                    d.setCode(generateCode(resolvedDepartmentName));
                    d.setFaculty(student.getFaculty());
                    d.setCampus(student.getCampus());
                    return departmentRepository.save(d);
                });

        Optional<LabourApplication> existing = repository.findFirstByStudentIdAndStatusOrderBySubmittedAtDesc(
                student.getId(),
                LabourApplicationStatus.PENDING
        );
        if (existing.isPresent()) {
            throw new IllegalArgumentException("You already have a pending application.");
        }

        boolean hasActiveOrPending = repository.existsByStudentIdAndStatusIn(
                student.getId(),
                List.of(LabourApplicationStatus.PENDING, LabourApplicationStatus.APPROVED)
        );
        if (hasActiveOrPending) {
            throw new IllegalArgumentException("You already have an active or pending labour job application.");
        }

        LabourApplication application = new LabourApplication();
        application.setStudent(student);
        application.setDepartment(department);
        application.setTerm(term);
        application.setCoverLetterText(safeTrim(coverLetterText));
        application.setRoleTitle(safeTrim(roleTitle));
        application.setSubmittedAt(LocalDateTime.now());

        if (coverLetterFile != null && !coverLetterFile.isEmpty()) {
            application.setCoverLetterPath(storeFile(coverLetterFile, "cover-letter"));
        }
        if (transcriptFile != null && !transcriptFile.isEmpty()) {
            application.setTranscriptPath(storeFile(transcriptFile, "transcript"));
        }

        application = repository.save(application);
        return toResponse(application);
    }

    @Transactional
    public LabourApplicationResponse reviewApplication(Long id, LabourApplicationReviewRequest request) {
        if (request == null || isBlank(request.getDecision()) || isBlank(request.getReviewerDepartment())) {
            throw new IllegalArgumentException("decision and reviewerDepartment are required.");
        }

        LabourApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found."));

        String departmentName = application.getDepartment() != null ? application.getDepartment().getName() : "";
        if (!departmentName.equalsIgnoreCase(request.getReviewerDepartment().trim())) {
            throw new IllegalArgumentException("Reviewer is not authorized for this department.");
        }

        LabourApplicationStatus status = parseDecision(request.getDecision());
        application.setStatus(status);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewNotes(safeTrim(request.getNotes()));

        if (request.getReviewerUserId() != null) {
            UserAccount reviewer = userAccountRepository.findById(request.getReviewerUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Reviewer not found."));
            application.setReviewedBy(reviewer);
        }

        application = repository.save(application);
        return toResponse(application);
    }

    @Transactional
    public LabourApplicationResponse withdrawApplication(Long id, String studentNumber) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }

        LabourApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found."));

        String ownerStudentNumber = application.getStudent() != null ? application.getStudent().getStudentNumber() : "";
        if (!studentNumber.trim().equalsIgnoreCase(ownerStudentNumber)) {
            throw new IllegalArgumentException("You can withdraw only your own application.");
        }

        if (application.getStatus() != LabourApplicationStatus.PENDING) {
            throw new IllegalArgumentException("Only pending applications can be withdrawn.");
        }

        application.setStatus(LabourApplicationStatus.WITHDRAWN);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewNotes("Withdrawn by student.");
        application = repository.save(application);
        return toResponse(application);
    }

    private LabourApplicationResponse toResponse(LabourApplication application) {
        String studentName = application.getStudent() != null && application.getStudent().getUserAccount() != null
                ? application.getStudent().getUserAccount().getFirstName() + " " + application.getStudent().getUserAccount().getLastName()
                : "";
        String studentNumber = application.getStudent() != null ? application.getStudent().getStudentNumber() : "";
        String departmentName = application.getDepartment() != null ? application.getDepartment().getName() : "";

        return new LabourApplicationResponse(
                application.getId(),
                studentNumber,
                studentName,
                departmentName,
                application.getStatus().name(),
                application.getSubmittedAt(),
                application.getCoverLetterPath(),
                application.getTranscriptPath(),
                application.getCoverLetterText(),
                application.getRoleTitle(),
                application.getReviewedAt(),
                application.getReviewNotes()
        );
    }

    private LabourApplicationStatus parseStatus(String status) {
        try {
            return LabourApplicationStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid status value.");
        }
    }

    private LabourApplicationStatus parseDecision(String decision) {
        LabourApplicationStatus status = parseStatus(decision);
        if (status != LabourApplicationStatus.APPROVED && status != LabourApplicationStatus.REJECTED) {
            throw new IllegalArgumentException("Decision must be APPROVED or REJECTED.");
        }
        return status;
    }

    private String storeFile(MultipartFile file, String prefix) {
        try {
            Files.createDirectories(labourUploadDir);

            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = prefix + "-" + System.currentTimeMillis() + "-" + safeName;

            Path destination = labourUploadDir.resolve(filename).normalize();
            if (!destination.startsWith(labourUploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(file.getInputStream(), destination);
            return destination.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store file. Check server write permissions.");
        }
    }

    private String generateCode(String text) {
        String lettersOnly = text.toUpperCase().replaceAll("[^A-Z]", "");
        String base = lettersOnly.length() >= 3 ? lettersOnly.substring(0, 3) : "DEP";
        return base + System.currentTimeMillis() % 100000;
    }

    private String resolveDepartmentName(StudentProfile student, String requestedDepartment) {
        if (!isBlank(requestedDepartment)) {
            return requestedDepartment.trim();
        }
        if (student.getDepartment() != null && !isBlank(student.getDepartment().getName())) {
            return student.getDepartment().getName().trim();
        }
        return "GENERAL LABOUR";
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String safeTrim(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private Path resolveUploadDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "labour").toAbsolutePath().normalize();
    }
}
