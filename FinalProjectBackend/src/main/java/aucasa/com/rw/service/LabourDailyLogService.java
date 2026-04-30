package aucasa.com.rw.service;

import aucasa.com.rw.domain.LabourApplication;
import aucasa.com.rw.domain.LabourBackfillApproval;
import aucasa.com.rw.domain.LabourDailyLog;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.LabourApplicationStatus;
import aucasa.com.rw.domain.enums.LabourLogStatus;
import aucasa.com.rw.dto.labour.LabourDailyLogRequest;
import aucasa.com.rw.dto.labour.LabourDailyLogResponse;
import aucasa.com.rw.dto.labour.LabourDailyLogReviewRequest;
import aucasa.com.rw.dto.labour.LabourMonthlyPerformanceItem;
import aucasa.com.rw.repository.LabourApplicationRepository;
import aucasa.com.rw.repository.LabourBackfillApprovalRepository;
import aucasa.com.rw.repository.LabourDailyLogRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfGState;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfTemplate;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.awt.Color;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LabourDailyLogService {
    private final LabourDailyLogRepository repository;
    private final LabourApplicationRepository applicationRepository;
    private final LabourBackfillApprovalRepository backfillApprovalRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final String reportLogoPath;

    public LabourDailyLogService(
            LabourDailyLogRepository repository,
            LabourApplicationRepository applicationRepository,
            LabourBackfillApprovalRepository backfillApprovalRepository,
            StudentProfileRepository studentProfileRepository,
            UserAccountRepository userAccountRepository,
            @Value("${app.finance.report-paper-path:}") String reportLogoPath
    ) {
        this.repository = repository;
        this.applicationRepository = applicationRepository;
        this.backfillApprovalRepository = backfillApprovalRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userAccountRepository = userAccountRepository;
        this.reportLogoPath = reportLogoPath;
    }

    @Transactional
    public LabourDailyLogResponse submitLog(LabourDailyLogRequest request) {
        if (request == null || isBlank(request.getStudentNumber()) || isBlank(request.getLogDate())
                || isBlank(request.getTaskDescription()) || isBlank(request.getWorkStartTime()) || isBlank(request.getWorkEndTime())) {
            throw new IllegalArgumentException("studentNumber, logDate, taskDescription, workStartTime, and workEndTime are required.");
        }

        StudentProfile student = studentProfileRepository
                .findByStudentNumber(request.getStudentNumber().trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        LabourApplication application = applicationRepository
                .findFirstByStudentIdAndStatusOrderBySubmittedAtDesc(student.getId(), LabourApplicationStatus.APPROVED)
                .orElseThrow(() -> new IllegalArgumentException("No approved labour application found."));

        LocalDate requestedDate = LocalDate.parse(request.getLogDate().trim());
        LocalDate today = LocalDate.now();
        if (requestedDate.isAfter(today)) {
            throw new IllegalArgumentException("Log date cannot be in the future.");
        }

        if (repository.existsByApplicationIdAndLogDate(application.getId(), requestedDate)) {
            throw new IllegalArgumentException("Daily record already submitted for this date. You can submit only once per day.");
        }

        // Backfill policy: student can submit at most 2 days back, and must provide reason.
        if (requestedDate.isBefore(today)) {
            if (requestedDate.isBefore(today.minusDays(2))) {
                throw new IllegalArgumentException("Late daily record is allowed only within the last 2 days with a reason.");
            }
            if (isBlank(request.getLateSubmissionReason())) {
                throw new IllegalArgumentException("Please provide reason for late submission.");
            }
            LabourBackfillApproval approval = backfillApprovalRepository
                    .findFirstByStudentIdAndActiveTrueOrderByApprovedAtDesc(student.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Late backfill requires dean approval. Ask dean to click 'Approve Late Backfill' first."
                    ));
            if (approval.getRemainingEntries() == null || approval.getRemainingEntries() <= 0) {
                approval.setActive(false);
                backfillApprovalRepository.save(approval);
                throw new IllegalArgumentException("Your late backfill allowance is exhausted. Request dean approval again.");
            }
            approval.setRemainingEntries(approval.getRemainingEntries() - 1);
            if (approval.getRemainingEntries() <= 0) {
                approval.setActive(false);
            }
            backfillApprovalRepository.save(approval);
        }

        BigDecimal latitude = parseDecimal(request.getLatitude(), "latitude");
        BigDecimal longitude = parseDecimal(request.getLongitude(), "longitude");
        boolean locationValidated = isWithinCampusRange(application, latitude, longitude);
        if (!locationValidated) {
            throw new IllegalArgumentException("Location validation failed. You must submit from your assigned campus range.");
        }

        LabourDailyLog log = new LabourDailyLog();
        log.setApplication(application);
        log.setLogDate(requestedDate);
        LocalTime workStart = parseTime(request.getWorkStartTime(), "workStartTime");
        LocalTime workEnd = parseTime(request.getWorkEndTime(), "workEndTime");
        BigDecimal computedHours = computeHours(workStart, workEnd);
        log.setWorkStartTime(workStart);
        log.setWorkEndTime(workEnd);
        log.setHoursWorked(computedHours);
        log.setTaskDescription(request.getTaskDescription().trim());
        log.setLatitude(latitude);
        log.setLongitude(longitude);
        log.setLocationValidated(locationValidated);
        log.setLateSubmissionReason(safeTrim(request.getLateSubmissionReason()));
        log.setStatus(LabourLogStatus.VERIFIED);
        log.setVerifiedAt(LocalDateTime.now());
        log.setVerificationNote("Auto-verified by system validation");
        log = repository.save(log);

        return toResponse(log);
    }

    @Transactional(readOnly = true)
    public List<String> getStudentReminders(String studentNumber) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }
        StudentProfile student = studentProfileRepository
                .findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        LabourApplication application = applicationRepository
                .findFirstByStudentIdAndStatusOrderBySubmittedAtDesc(student.getId(), LabourApplicationStatus.APPROVED)
                .orElse(null);

        if (application == null) {
            return List.of("No active approved labour role yet.");
        }

        List<LabourDailyLog> logs = repository.findByApplicationId(application.getId());
        LocalDate today = LocalDate.now();

        boolean hasTodayLog = logs.stream().anyMatch(l -> today.equals(l.getLogDate()));
        long missingInLast5 = 0L;
        for (int i = 1; i <= 5; i++) {
            LocalDate day = today.minusDays(i);
            boolean found = logs.stream().anyMatch(l -> day.equals(l.getLogDate()));
            if (!found) missingInLast5++;
        }

        List<String> reminders = new ArrayList<>();
        if (!hasTodayLog) {
            reminders.add("You have not submitted today's daily labour record yet.");
        }
        if (missingInLast5 >= 2) {
            reminders.add("Attendance alert: you missed " + missingInLast5 + " daily records in the last 5 days.");
        }
        backfillApprovalRepository.findFirstByStudentIdAndActiveTrueOrderByApprovedAtDesc(student.getId())
                .ifPresent(approval -> reminders.add("Dean approved late backfill: remaining missed-log entries = " + approval.getRemainingEntries()));
        if (reminders.isEmpty()) {
            reminders.add("Great! Your daily labour records are up to date.");
        }
        return reminders;
    }

    @Transactional
    public String approveLateBackfill(String studentNumber, String approvalNote, String approvedBy) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }

        StudentProfile student = studentProfileRepository
                .findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        LabourApplication approvedApplication = applicationRepository
                .findFirstByStudentIdAndStatusOrderBySubmittedAtDesc(student.getId(), LabourApplicationStatus.APPROVED)
                .orElseThrow(() -> new IllegalArgumentException("Student does not have an approved labour role."));

        LabourBackfillApproval approval = backfillApprovalRepository
                .findFirstByStudentIdAndActiveTrueOrderByApprovedAtDesc(student.getId())
                .orElseGet(LabourBackfillApproval::new);

        approval.setStudent(student);
        approval.setRemainingEntries(2);
        approval.setActive(true);
        approval.setApprovalNote(safeTrim(approvalNote));
        approval.setApprovedBy(isBlank(approvedBy) ? "Dean" : approvedBy.trim());
        approval.setApprovedAt(LocalDateTime.now());
        backfillApprovalRepository.save(approval);

        return "Late backfill approved for " + approvedApplication.getStudent().getStudentNumber()
                + " (2 missed-log entries allowed).";
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

    @Transactional(readOnly = true)
    public List<LabourMonthlyPerformanceItem> getMonthlyPerformance(String campus, String roleTitle, String month) {
        YearMonth ym;
        try {
            ym = isBlank(month) ? YearMonth.now() : YearMonth.parse(month.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid month format. Use YYYY-MM.");
        }
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<LabourApplication> approvedApps = applicationRepository.findByStatus(LabourApplicationStatus.APPROVED).stream()
                .filter(app -> isBlank(campus) || getDepartmentName(app).equalsIgnoreCase(campus.trim()))
                .filter(app -> isBlank(roleTitle) || safe(app.getRoleTitle()).equalsIgnoreCase(roleTitle.trim()))
                .toList();

        int expectedWorkDays = countWeekdays(start, end);
        List<LabourMonthlyPerformanceItem> result = new ArrayList<>();
        for (LabourApplication app : approvedApps) {
            List<LabourDailyLog> logs = repository.findByApplicationId(app.getId()).stream()
                    .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(start) && !l.getLogDate().isAfter(end))
                    .toList();

            Set<LocalDate> presentDays = new HashSet<>();
            BigDecimal hours = BigDecimal.ZERO;
            for (LabourDailyLog log : logs) {
                presentDays.add(log.getLogDate());
                hours = hours.add(log.getHoursWorked() != null ? log.getHoursWorked() : BigDecimal.ZERO);
            }
            int present = presentDays.size();
            int missed = Math.max(0, expectedWorkDays - present);
            result.add(new LabourMonthlyPerformanceItem(
                    app.getStudent() != null ? safe(app.getStudent().getStudentNumber()) : "-",
                    getStudentName(app),
                    getDepartmentName(app),
                    safe(app.getRoleTitle()),
                    expectedWorkDays,
                    present,
                    missed,
                    hours.setScale(1, RoundingMode.HALF_UP).toPlainString()
            ));
        }
        return result;
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

    @Transactional(readOnly = true)
    public byte[] buildDeanLabourReportPdf(String department, String roleTitle) {
        String departmentFilter = normalize(department);
        String roleTitleFilter = normalize(roleTitle);

        List<LabourApplication> applications = applicationRepository.findAll().stream()
                .filter(app -> departmentFilter == null || departmentFilter.equalsIgnoreCase(getDepartmentName(app)))
                .filter(app -> roleTitleFilter == null || roleTitleFilter.equalsIgnoreCase(safe(app.getRoleTitle())))
                .sorted(Comparator.comparing(LabourApplication::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<LabourDailyLog> logs = repository.findAll().stream()
                .filter(log -> departmentFilter == null || departmentFilter.equalsIgnoreCase(getDepartmentName(log.getApplication())))
                .sorted(Comparator.comparing(LabourDailyLog::getLogDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");

        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(44, 62, 80));
        Font subtitleFont = new Font(Font.HELVETICA, 11, Font.NORMAL, new Color(107, 114, 128));
        Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(44, 62, 80));
        Font bodyFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 24f, 24f, 62f, 38f);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new LabourPdfPageDecorator(reportLogoPath, "Adventist University of Central Africa", "StudentHub System"));
            document.open();

            try {
                if (reportLogoPath != null && !reportLogoPath.isBlank()) {
                    Image centeredLogo = Image.getInstance(reportLogoPath);
                    centeredLogo.scaleToFit(360, 360);
                    centeredLogo.setAlignment(Element.ALIGN_CENTER);
                    document.add(centeredLogo);
                }
            } catch (Exception ignored) {
                // logo optional
            }

            Paragraph uni = new Paragraph("ADVENTIST UNIVERSITY OF CENTRAL AFRICA", titleFont);
            uni.setAlignment(Element.ALIGN_CENTER);
            document.add(uni);

            Paragraph dept = new Paragraph("Monthly Student Labour Report", subtitleFont);
            dept.setAlignment(Element.ALIGN_CENTER);
            document.add(dept);

            String filterLabel = departmentFilter == null ? "All Campuses" : departmentFilter;
            String roleFilterLabel = roleTitleFilter == null ? "All Positions" : roleTitleFilter;
            Paragraph generated = new Paragraph(
                    "Campus: " + filterLabel + "  |  Position: " + roleFilterLabel + "  |  Date Range: " + LocalDate.now().withDayOfMonth(1) + " to " + LocalDate.now(),
                    subtitleFont
            );
            generated.setAlignment(Element.ALIGN_CENTER);
            document.add(generated);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("MONTHLY LOG RECORDS", sectionFont));
            document.add(new Paragraph(" "));
            PdfPTable logsTable = new PdfPTable(5);
            logsTable.setWidthPercentage(100);
            logsTable.setWidths(new float[]{1.1f, 1.9f, 1.4f, 1.8f, 0.8f});
            addHeaderCell(logsTable, "Student No.");
            addHeaderCell(logsTable, "Student Name");
            addHeaderCell(logsTable, "Campus");
            addHeaderCell(logsTable, "Position");
            addHeaderCell(logsTable, "Hours");

            for (LabourDailyLog log : logs) {
                LabourApplication app = log.getApplication();
                addBodyCell(logsTable, app != null && app.getStudent() != null ? safe(app.getStudent().getStudentNumber()) : "-");
                addBodyCell(logsTable, getStudentName(app));
                addBodyCell(logsTable, getDepartmentName(app));
                addBodyCell(logsTable, app != null ? safe(app.getRoleTitle()) : "-");
                addBodyCell(logsTable, log.getHoursWorked() != null ? log.getHoursWorked().toPlainString() : "-");
            }

            if (logs.isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No daily log records found.", bodyFont));
                empty.setColspan(5);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                empty.setPadding(6f);
                logsTable.addCell(empty);
            }
            document.add(logsTable);

            document.close();
            return out.toByteArray();
        } catch (IOException | DocumentException ex) {
            throw new IllegalArgumentException("Failed to generate labour PDF report.");
        }
    }

    @Transactional(readOnly = true)
    public byte[] buildStudentLabourReportPdf(String studentNumber) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }

        StudentProfile student = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        LabourApplication approvedApplication = applicationRepository
                .findFirstByStudentIdAndStatusOrderBySubmittedAtDesc(student.getId(), LabourApplicationStatus.APPROVED)
                .orElseThrow(() -> new IllegalArgumentException("No approved labour position found for this student."));

        List<LabourDailyLog> logs = repository.findByApplicationId(approvedApplication.getId()).stream()
                .sorted(Comparator.comparing(LabourDailyLog::getLogDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(44, 62, 80));
        Font subtitleFont = new Font(Font.HELVETICA, 11, Font.NORMAL, new Color(107, 114, 128));
        Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(44, 62, 80));
        Font bodyFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 24f, 24f, 62f, 38f);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new LabourPdfPageDecorator(reportLogoPath, "Adventist University of Central Africa", "StudentHub System"));
            document.open();

            try {
                if (reportLogoPath != null && !reportLogoPath.isBlank()) {
                    Image centeredLogo = Image.getInstance(reportLogoPath);
                    centeredLogo.scaleToFit(360, 360);
                    centeredLogo.setAlignment(Element.ALIGN_CENTER);
                    document.add(centeredLogo);
                }
            } catch (Exception ignored) {
                // logo optional
            }

            Paragraph uni = new Paragraph("ADVENTIST UNIVERSITY OF CENTRAL AFRICA", titleFont);
            uni.setAlignment(Element.ALIGN_CENTER);
            document.add(uni);

            Paragraph reportTitle = new Paragraph("Individual Monthly Student Labour Report", subtitleFont);
            reportTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(reportTitle);

            Paragraph meta = new Paragraph(
                    "Student: " + getStudentName(approvedApplication)
                            + "  |  Student No: " + safe(student.getStudentNumber())
                            + "  |  Campus: " + getDepartmentName(approvedApplication)
                            + "  |  Position: " + safe(approvedApplication.getRoleTitle()),
                    subtitleFont
            );
            meta.setAlignment(Element.ALIGN_CENTER);
            document.add(meta);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("MONTHLY LOG RECORDS", sectionFont));
            document.add(new Paragraph(" "));

            PdfPTable logsTable = new PdfPTable(3);
            logsTable.setWidthPercentage(100);
            logsTable.setWidths(new float[]{1.1f, 0.8f, 4.1f});
            addHeaderCell(logsTable, "Date (Days Worked)");
            addHeaderCell(logsTable, "Hours (Worked)");
            addHeaderCell(logsTable, "Task (Done on that Date)");

            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd MMM yyyy");
            for (LabourDailyLog log : logs) {
                addBodyCell(logsTable, log.getLogDate() != null ? log.getLogDate().format(dateFmt) : "-");
                addBodyCell(logsTable, log.getHoursWorked() != null ? log.getHoursWorked().toPlainString() : "-");
                addBodyCell(logsTable, safe(log.getTaskDescription()));
            }

            if (logs.isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No daily log records found for this student.", bodyFont));
                empty.setColspan(3);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                empty.setPadding(6f);
                logsTable.addCell(empty);
            }

            document.add(logsTable);
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            Paragraph supervisorLine = new Paragraph("Name of Supervisor: ________________________________", sectionFont);
            supervisorLine.setAlignment(Element.ALIGN_LEFT);
            document.add(supervisorLine);
            Paragraph signatureLine = new Paragraph("Signature: ________________________________", sectionFont);
            signatureLine.setAlignment(Element.ALIGN_LEFT);
            document.add(signatureLine);

            document.close();
            return out.toByteArray();
        } catch (IOException | DocumentException ex) {
            throw new IllegalArgumentException("Failed to generate student labour PDF report.");
        }
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
                log.getStatus().name(),
                Boolean.TRUE.equals(log.getLocationValidated()),
                log.getLateSubmissionReason()
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

    private int countWeekdays(LocalDate start, LocalDate end) {
        int count = 0;
        LocalDate d = start;
        while (!d.isAfter(end)) {
            int dow = d.getDayOfWeek().getValue();
            if (dow >= 1 && dow <= 5) count++;
            d = d.plusDays(1);
        }
        return count;
    }

    private String safeTrim(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private String normalize(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private String getDepartmentName(LabourApplication application) {
        if (application == null || application.getDepartment() == null || isBlank(application.getDepartment().getName())) {
            return "-";
        }
        return application.getDepartment().getName();
    }

    private String getStudentName(LabourApplication application) {
        if (application == null || application.getStudent() == null || application.getStudent().getUserAccount() == null) {
            return "-";
        }
        UserAccount account = application.getStudent().getUserAccount();
        String full = (safe(account.getFirstName()) + " " + safe(account.getLastName())).trim();
        return full.isBlank() ? "-" : full;
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private BigDecimal parseDecimal(String value, String fieldName) {
        if (isBlank(value)) {
            throw new IllegalArgumentException(fieldName + " is required for location validation.");
        }
        try {
            return new BigDecimal(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid " + fieldName + " value.");
        }
    }

    private LocalTime parseTime(String value, String fieldName) {
        try {
            return LocalTime.parse(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid " + fieldName + " format. Use HH:mm.");
        }
    }

    private BigDecimal computeHours(LocalTime start, LocalTime end) {
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("workEndTime must be after workStartTime.");
        }
        long minutes = Duration.between(start, end).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP)
                .setScale(1, RoundingMode.HALF_UP);
        if (hours.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Daily hours must be greater than zero.");
        }
        if (hours.compareTo(new BigDecimal("12.0")) > 0) {
            throw new IllegalArgumentException("Daily hours cannot exceed 12.0 hours.");
        }
        return hours;
    }

    private boolean isWithinCampusRange(LabourApplication application, BigDecimal lat, BigDecimal lon) {
        String campus = getDepartmentName(application).toLowerCase(Locale.ROOT);

        // Match attendance geofence coordinates exactly for consistency.
        double targetLat;
        double targetLon;
        if (campus.contains("gishushu")) {
            targetLat = -1.9559;
            targetLon = 30.1041;
        } else {
            // Default to Masoro for all other labour roles/campuses
            targetLat = -1.9452;
            targetLon = 30.1431;
        }

        double distanceMeters = haversineMeters(
                lat.doubleValue(),
                lon.doubleValue(),
                targetLat,
                targetLon
        );

        // Use same campus boundary radius as attendance check-in.
        return distanceMeters <= 2000.0d;
    }

    private double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final double r = 6371000.0d;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return r * c;
    }

    private static class LabourPdfPageDecorator extends PdfPageEventHelper {
        private final String logoPath;
        private final String organization;
        private final String systemName;
        private PdfTemplate totalTemplate;

        private LabourPdfPageDecorator(String logoPath, String organization, String systemName) {
            this.logoPath = logoPath;
            this.organization = organization;
            this.systemName = systemName;
        }

        @Override
        public void onOpenDocument(PdfWriter writer, Document document) {
            totalTemplate = writer.getDirectContent().createTemplate(40, 14);
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Rectangle page = document.getPageSize();
            float footerY = page.getBottom(18);

            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                    new Phrase("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                            new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    page.getLeft(24), footerY, 0);

            String pageText = "Page " + writer.getPageNumber() + " of ";
            float centerX = page.getWidth() / 2f;
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                    new Phrase(pageText, new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    centerX, footerY, 0);
            cb.addTemplate(totalTemplate, centerX + 16, footerY - 2);

            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                    new Phrase(organization + " | " + systemName, new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    page.getRight(24), footerY, 0);

            PdfGState gState = new PdfGState();
            gState.setFillOpacity(0.08f);
            cb.saveState();
            cb.setGState(gState);
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                    new Phrase("AUCA STUDENT LABOUR REPORT", new Font(Font.HELVETICA, 42, Font.BOLD, new Color(44, 62, 80))),
                    page.getWidth() / 2f, page.getHeight() / 2f, 45);
            cb.restoreState();

            // Keep a single visible logo in the main header content only.
        }

        @Override
        public void onCloseDocument(PdfWriter writer, Document document) {
            ColumnText.showTextAligned(totalTemplate, Element.ALIGN_LEFT,
                    new Phrase(String.valueOf(writer.getPageNumber() - 1), new Font(Font.HELVETICA, 8, Font.NORMAL)),
                    0, 0, 0);
        }
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.BOLD)));
        cell.setPadding(4f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(new Color(44, 62, 80));
        cell.setBorderColor(Color.GRAY);
        cell.getPhrase().getFont().setColor(Color.WHITE);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.NORMAL)));
        cell.setPadding(3.5f);
        cell.setBorderColor(Color.GRAY);
        table.addCell(cell);
    }

    private void addStatusCell(PdfPTable table, String status) {
        Font f = new Font(Font.HELVETICA, 8, Font.BOLD);
        String value = safe(status).toUpperCase(Locale.ROOT);
        if ("APPROVED".equals(value) || "VERIFIED".equals(value)) {
            f.setColor(new Color(39, 174, 96));
        } else if ("PENDING".equals(value) || "PENDING_REVIEW".equals(value)) {
            f.setColor(new Color(243, 156, 18));
        } else if ("REJECTED".equals(value)) {
            f.setColor(new Color(231, 76, 60));
        } else {
            f.setColor(Color.DARK_GRAY);
        }
        PdfPCell cell = new PdfPCell(new Phrase(value, f));
        cell.setPadding(3.5f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBorderColor(Color.GRAY);
        table.addCell(cell);
    }

    private void addSummaryPair(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, new Font(Font.HELVETICA, 8, Font.BOLD)));
        labelCell.setPadding(4f);
        labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, new Font(Font.HELVETICA, 9, Font.NORMAL)));
        valueCell.setPadding(4f);
        valueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(valueCell);
    }
}
