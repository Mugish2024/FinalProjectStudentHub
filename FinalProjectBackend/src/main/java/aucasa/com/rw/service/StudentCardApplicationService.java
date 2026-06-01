package aucasa.com.rw.service;

import aucasa.com.rw.domain.StudentCardApplication;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.StudentCardApplicationStatus;
import aucasa.com.rw.dto.studentcard.StudentCardApplicationResponse;
import aucasa.com.rw.repository.StudentCardApplicationRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class StudentCardApplicationService {
    private final StudentCardApplicationRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final Path uploadDir;

    public StudentCardApplicationService(
            StudentCardApplicationRepository repository,
            StudentProfileRepository studentProfileRepository,
            UserAccountRepository userAccountRepository,
            @Value("${app.storage.student-card-upload-dir:}") String uploadDir
    ) {
        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.userAccountRepository = userAccountRepository;
        this.uploadDir = resolveUploadDir(uploadDir);
    }

    @Transactional(readOnly = true)
    public List<StudentCardApplicationResponse> list(String statusRaw) {
        List<StudentCardApplication> applications;
        if (statusRaw != null && !statusRaw.isBlank()) {
            applications = repository.findByStatusOrderByAppliedAtDesc(parseStatus(statusRaw));
        } else {
            applications = repository.findAllByOrderByAppliedAtDesc();
        }
        return applications.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public StudentCardApplicationResponse latestForStudent(String studentNumber) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }
        return repository.findFirstByStudentStudentNumberOrderByAppliedAtDesc(studentNumber.trim())
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public StudentCardApplicationResponse submit(String studentNumber, MultipartFile photo) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }
        validatePhoto(photo);

        StudentProfile student = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        repository.findFirstByStudentStudentNumberAndStatusOrderByAppliedAtDesc(
                student.getStudentNumber(),
                StudentCardApplicationStatus.PENDING
        ).ifPresent(existing -> {
            throw new IllegalArgumentException("You already have a pending student card request.");
        });

        StudentCardApplication application = new StudentCardApplication();
        application.setStudent(student);
        application.setPhotoPath(storePhoto(photo));
        application.setReplacementRequest(repository.existsByStudentStudentNumber(student.getStudentNumber()));
        application.setFinanceReceiptStatus(application.isReplacementRequest() ? "WAITING_UPLOAD" : "NOT_REQUIRED");
        application.setStatus(StudentCardApplicationStatus.PENDING);
        application.setAppliedAt(LocalDateTime.now());

        return toResponse(repository.save(application));
    }

    @Transactional
    public StudentCardApplicationResponse markPrinted(Long id, Long managerUserId) {
        StudentCardApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student card request not found."));
        if (application.isReplacementRequest() && !"APPROVED".equals(application.getFinanceReceiptStatus())) {
            throw new IllegalArgumentException("Approve the finance receipt before marking a replacement card as printed.");
        }
        application.setStatus(StudentCardApplicationStatus.PRINTED);
        application.setPrintedAt(LocalDateTime.now());
        if (managerUserId != null) {
            UserAccount manager = userAccountRepository.findById(managerUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Manager user not found."));
            application.setPrintedBy(manager);
        }
        return toResponse(repository.save(application));
    }

    @Transactional
    public StudentCardApplicationResponse uploadFinanceReceipt(Long id, String studentNumber, MultipartFile receipt) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }
        validateReceipt(receipt);
        StudentCardApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student card request not found."));
        String owner = application.getStudent() != null ? application.getStudent().getStudentNumber() : "";
        if (!studentNumber.trim().equalsIgnoreCase(owner)) {
            throw new IllegalArgumentException("You can upload receipt only for your own student card request.");
        }
        application.setFinanceReceiptPath(storeFile(receipt, "finance-receipt"));
        application.setReceiptUploadedAt(LocalDateTime.now());
        application.setFinanceReceiptStatus("PENDING_REVIEW");
        application.setFinanceReceiptMessage("Finance office receipt uploaded. Card office is reviewing it.");
        application.setFinanceReceiptReviewedAt(null);
        return toResponse(repository.save(application));
    }

    @Transactional
    public StudentCardApplicationResponse reviewFinanceReceipt(Long id, boolean approved, String message) {
        StudentCardApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student card request not found."));
        if (!application.isReplacementRequest()) {
            throw new IllegalArgumentException("Finance receipt review is required only for replacement card requests.");
        }
        if (approved && isBlank(application.getFinanceReceiptPath())) {
            throw new IllegalArgumentException("Student has not uploaded a finance receipt yet.");
        }
        application.setFinanceReceiptStatus(approved ? "APPROVED" : "REJECTED");
        application.setFinanceReceiptMessage(approved
                ? "Finance receipt approved. Your replacement card can now be printed."
                : (!isBlank(message) ? message.trim() : "The finance receipt was rejected. Please upload a valid receipt from the finance office."));
        application.setFinanceReceiptReviewedAt(LocalDateTime.now());
        return toResponse(repository.save(application));
    }

    @Transactional(readOnly = true)
    public Resource loadPhoto(Long id) {
        StudentCardApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student card request not found."));
        try {
            Path path = Paths.get(application.getPhotoPath()).toAbsolutePath().normalize();
            if (!path.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid photo path.");
            }
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("Photo is not available.");
            }
            return resource;
        } catch (IOException ex) {
            throw new IllegalArgumentException("Photo is not available.");
        }
    }

    @Transactional(readOnly = true)
    public Resource loadFinanceReceipt(Long id) {
        StudentCardApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student card request not found."));
        if (isBlank(application.getFinanceReceiptPath())) {
            throw new IllegalArgumentException("Finance receipt is not available.");
        }
        return loadStoredResource(application.getFinanceReceiptPath(), "Finance receipt is not available.");
    }

    private StudentCardApplicationResponse toResponse(StudentCardApplication application) {
        StudentProfile student = application.getStudent();
        UserAccount user = student != null ? student.getUserAccount() : null;
        String studentName = user != null ? user.getFirstName() + " " + user.getLastName() : "";
        String printedByName = application.getPrintedBy() != null
                ? application.getPrintedBy().getFirstName() + " " + application.getPrintedBy().getLastName()
                : "";

        return new StudentCardApplicationResponse(
                application.getId(),
                student != null ? student.getStudentNumber() : "",
                studentName,
                student != null && student.getFaculty() != null ? student.getFaculty().getName() : "",
                student != null && student.getDepartment() != null ? student.getDepartment().getName() : "",
                student != null ? student.getProgram() : "",
                application.getStatus().name(),
                application.getAppliedAt(),
                application.getPrintedAt(),
                application.isReplacementRequest(),
                !isBlank(application.getFinanceReceiptPath()),
                application.getReceiptUploadedAt(),
                receiptStatus(application),
                application.getFinanceReceiptMessage(),
                application.getFinanceReceiptReviewedAt(),
                printedByName
        );
    }

    private void validatePhoto(MultipartFile photo) {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("Passport photo is required.");
        }
        String contentType = photo.getContentType() != null ? photo.getContentType().toLowerCase(Locale.ROOT) : "";
        if (!contentType.equals("image/jpeg") && !contentType.equals("image/png")) {
            throw new IllegalArgumentException("Passport photo must be JPG or PNG.");
        }
        if (photo.getSize() > 5L * 1024L * 1024L) {
            throw new IllegalArgumentException("Passport photo must be 5MB or smaller.");
        }
    }

    private String storePhoto(MultipartFile photo) {
        return storeFile(photo, "student-card");
    }

    private String storeFile(MultipartFile file, String prefix) {
        try {
            Files.createDirectories(uploadDir);
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = prefix + "-" + System.currentTimeMillis() + "-" + safeName;
            Path destination = uploadDir.resolve(filename).normalize();
            if (!destination.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(file.getInputStream(), destination);
            return destination.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store file. Check server write permissions.");
        }
    }

    private void validateReceipt(MultipartFile receipt) {
        if (receipt == null || receipt.isEmpty()) {
            throw new IllegalArgumentException("Finance receipt is required.");
        }
        String contentType = receipt.getContentType() != null ? receipt.getContentType().toLowerCase(Locale.ROOT) : "";
        boolean valid = contentType.equals("application/pdf") || contentType.equals("image/jpeg") || contentType.equals("image/png");
        if (!valid) {
            throw new IllegalArgumentException("Finance receipt must be PDF, JPG, or PNG.");
        }
        if (receipt.getSize() > 5L * 1024L * 1024L) {
            throw new IllegalArgumentException("Finance receipt must be 5MB or smaller.");
        }
    }

    private StudentCardApplicationStatus parseStatus(String statusRaw) {
        try {
            return StudentCardApplicationStatus.valueOf(statusRaw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid status value.");
        }
    }

    private Resource loadStoredResource(String storedPath, String unavailableMessage) {
        try {
            Path path = Paths.get(storedPath).toAbsolutePath().normalize();
            if (!path.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException(unavailableMessage);
            }
            return resource;
        } catch (IOException ex) {
            throw new IllegalArgumentException(unavailableMessage);
        }
    }

    private String receiptStatus(StudentCardApplication application) {
        if (!application.isReplacementRequest()) {
            return "NOT_REQUIRED";
        }
        if (isBlank(application.getFinanceReceiptPath())) {
            return "WAITING_UPLOAD";
        }
        return isBlank(application.getFinanceReceiptStatus())
                ? "PENDING_REVIEW"
                : application.getFinanceReceiptStatus();
    }

    private Path resolveUploadDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "student-cards").toAbsolutePath().normalize();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
