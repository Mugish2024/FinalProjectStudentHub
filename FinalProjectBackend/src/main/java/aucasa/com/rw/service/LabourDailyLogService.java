package aucasa.com.rw.service;

import aucasa.com.rw.domain.LabourApplication;
import aucasa.com.rw.domain.LabourDailyLog;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.LabourApplicationStatus;
import aucasa.com.rw.domain.enums.LabourLogStatus;
import aucasa.com.rw.dto.labour.LabourDailyLogRequest;
import aucasa.com.rw.dto.labour.LabourDailyLogResponse;
import aucasa.com.rw.dto.labour.LabourDailyLogReviewRequest;
import aucasa.com.rw.repository.LabourApplicationRepository;
import aucasa.com.rw.repository.LabourDailyLogRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LabourDailyLogService {
    private final LabourDailyLogRepository repository;
    private final LabourApplicationRepository applicationRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;

    public LabourDailyLogService(
            LabourDailyLogRepository repository,
            LabourApplicationRepository applicationRepository,
            StudentProfileRepository studentProfileRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.repository = repository;
        this.applicationRepository = applicationRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public LabourDailyLogResponse submitLog(LabourDailyLogRequest request) {
        if (request == null || isBlank(request.getStudentNumber()) || isBlank(request.getLogDate())
                || isBlank(request.getHoursWorked()) || isBlank(request.getTaskDescription())) {
            throw new IllegalArgumentException("studentNumber, logDate, hoursWorked, and taskDescription are required.");
        }

        StudentProfile student = studentProfileRepository
                .findByStudentNumber(request.getStudentNumber().trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        LabourApplication application = applicationRepository
                .findFirstByStudentIdAndStatusOrderBySubmittedAtDesc(student.getId(), LabourApplicationStatus.APPROVED)
                .orElseThrow(() -> new IllegalArgumentException("No approved labour application found."));

        LabourDailyLog log = new LabourDailyLog();
        log.setApplication(application);
        log.setLogDate(LocalDate.parse(request.getLogDate().trim()));
        log.setHoursWorked(new BigDecimal(request.getHoursWorked().trim()));
        log.setTaskDescription(request.getTaskDescription().trim());
        log = repository.save(log);

        return toResponse(log);
    }

    @Transactional(readOnly = true)
    public List<LabourDailyLogResponse> listLogs(String status, String department, String studentNumber) {
        List<LabourDailyLog> logs = new ArrayList<>();

        if (studentNumber != null && !studentNumber.isBlank()) {
            logs.addAll(repository.findByApplicationStudentStudentNumber(studentNumber.trim()));
        } else if (status != null && !status.isBlank()) {
            LabourLogStatus parsed = parseStatus(status);
            logs.addAll(repository.findByStatus(parsed));
        } else {
            logs.addAll(repository.findAll());
        }

        if (department != null && !department.isBlank()) {
            String dept = department.trim();
            logs = logs.stream()
                    .filter(log -> log.getApplication() != null
                            && log.getApplication().getDepartment() != null
                            && log.getApplication().getDepartment().getName().equalsIgnoreCase(dept))
                    .toList();
        }

        return logs.stream().map(this::toResponse).toList();
    }

    @Transactional
    public LabourDailyLogResponse reviewLog(Long id, LabourDailyLogReviewRequest request) {
        if (request == null || isBlank(request.getDecision()) || isBlank(request.getReviewerDepartment())) {
            throw new IllegalArgumentException("decision and reviewerDepartment are required.");
        }

        LabourDailyLog log = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Daily log not found."));

        String departmentName = log.getApplication() != null && log.getApplication().getDepartment() != null
                ? log.getApplication().getDepartment().getName()
                : "";
        if (!departmentName.equalsIgnoreCase(request.getReviewerDepartment().trim())) {
            throw new IllegalArgumentException("Reviewer is not authorized for this department.");
        }

        LabourLogStatus status = parseDecision(request.getDecision());
        log.setStatus(status);
        log.setVerifiedAt(LocalDateTime.now());
        log.setVerificationNote(safeTrim(request.getNotes()));

        if (request.getReviewerUserId() != null) {
            UserAccount reviewer = userAccountRepository.findById(request.getReviewerUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Reviewer not found."));
            log.setVerifiedBy(reviewer);
        }

        log = repository.save(log);
        return toResponse(log);
    }

    private LabourDailyLogResponse toResponse(LabourDailyLog log) {
        String studentName = log.getApplication() != null && log.getApplication().getStudent() != null
                && log.getApplication().getStudent().getUserAccount() != null
                ? log.getApplication().getStudent().getUserAccount().getFirstName() + " "
                    + log.getApplication().getStudent().getUserAccount().getLastName()
                : "";
        String departmentName = log.getApplication() != null && log.getApplication().getDepartment() != null
                ? log.getApplication().getDepartment().getName()
                : "";

        return new LabourDailyLogResponse(
                log.getId(),
                studentName,
                departmentName,
                log.getLogDate(),
                log.getHoursWorked().toPlainString(),
                log.getTaskDescription(),
                log.getStatus().name()
        );
    }

    private LabourLogStatus parseStatus(String status) {
        try {
            return LabourLogStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid status value.");
        }
    }

    private LabourLogStatus parseDecision(String decision) {
        LabourLogStatus status = parseStatus(decision);
        if (status != LabourLogStatus.VERIFIED && status != LabourLogStatus.REJECTED) {
            throw new IllegalArgumentException("Decision must be VERIFIED or REJECTED.");
        }
        return status;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String safeTrim(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
