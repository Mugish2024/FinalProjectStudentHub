package aucasa.com.rw.service;

import aucasa.com.rw.domain.AttendanceRecord;
import aucasa.com.rw.domain.AttendanceSession;
import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.Campus;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AttendanceMethod;
import aucasa.com.rw.domain.enums.AttendanceStatus;
import aucasa.com.rw.domain.enums.AttendanceVerificationStatus;
import aucasa.com.rw.dto.attendance.AttendanceCheckInRequest;
import aucasa.com.rw.dto.attendance.AttendanceRecordAdminResponse;
import aucasa.com.rw.dto.attendance.AttendanceRecordResponse;
import aucasa.com.rw.dto.attendance.AttendanceQrTokenResponse;
import aucasa.com.rw.dto.attendance.AttendanceSessionResponse;
import aucasa.com.rw.dto.attendance.AttendanceVerificationRequest;
import aucasa.com.rw.repository.AttendanceRecordRepository;
import aucasa.com.rw.repository.AttendanceSessionRepository;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.CampusRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AttendanceService {
    private static final String MASORO_GENERAL_ASSEMBLY_TITLE = "Masoro General Assembly";
    private static final String GISHUSHU_GENERAL_ASSEMBLY_TITLE = "Gishushu General Assembly";
    private static final long GENERAL_ASSEMBLY_DURATION_HOURS = 2;
    private static final ZoneId RWANDA_ZONE = ZoneId.of("Africa/Kigali");

    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final AcademicTermRepository academicTermRepository;
    private final CampusRepository campusRepository;
    private final List<String> allowedCidrs;
    private final boolean enforceNetworkForWifi;
    private final boolean enforceMockLocationCheck;
    private final double maxLocationAccuracyMeters;
    private final long biometricMaxAgeSeconds;
    private final String qrSecret;
    private final long qrTtlMinutes;
    private final String qrFrontendBaseUrl;
    private final Path absenceUploadDir;

    public AttendanceService(
            AttendanceSessionRepository sessionRepository,
            AttendanceRecordRepository recordRepository,
            StudentProfileRepository studentProfileRepository,
            UserAccountRepository userAccountRepository,
            AcademicTermRepository academicTermRepository,
            CampusRepository campusRepository,
            @Value("${app.attendance.allowed-cidrs:}") String allowedCidrs,
            @Value("${app.attendance.enforce-network:true}") boolean enforceNetworkForWifi,
            @Value("${app.attendance.enforce-mock-location-check:true}") boolean enforceMockLocationCheck,
            @Value("${app.attendance.max-location-accuracy-meters:2000}") double maxLocationAccuracyMeters,
            @Value("${app.attendance.biometric-max-age-seconds:120}") long biometricMaxAgeSeconds,
            @Value("${app.attendance.qr-secret:aucasa-attendance-secret}") String qrSecret,
            @Value("${app.attendance.qr-ttl-minutes:20}") long qrTtlMinutes,
            @Value("${app.attendance.qr-frontend-base-url:https://localhost:5173}") String qrFrontendBaseUrl,
            @Value("${app.storage.attendance-absence-upload-dir:}") String absenceUploadDir
    ) {
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userAccountRepository = userAccountRepository;
        this.academicTermRepository = academicTermRepository;
        this.campusRepository = campusRepository;
        this.allowedCidrs = Stream.of(allowedCidrs.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
        this.enforceNetworkForWifi = enforceNetworkForWifi;
        this.enforceMockLocationCheck = enforceMockLocationCheck;
        this.maxLocationAccuracyMeters = maxLocationAccuracyMeters;
        this.biometricMaxAgeSeconds = biometricMaxAgeSeconds;
        this.qrSecret = qrSecret;
        this.qrTtlMinutes = qrTtlMinutes;
        this.qrFrontendBaseUrl = qrFrontendBaseUrl;
        this.absenceUploadDir = resolveUploadDir(absenceUploadDir);
    }

    @Transactional
    public List<AttendanceSessionResponse> listSessions(boolean activeOnly) {
        ensureCampusSessionsIfMissing();
        autoCloseExpiredSessions();
        List<AttendanceSession> sessions = activeOnly ? sessionRepository.findByActiveTrue() : sessionRepository.findAll();
        return sessions.stream()
                .map(this::toSessionResponse)
                .toList();
    }

    @Transactional
    public AttendanceSessionResponse toggleSessionActive(Long sessionId, boolean active) {
        return toggleSessionActive(sessionId, active, null, null);
    }

    @Transactional
    public AttendanceSessionResponse toggleSessionActive(Long sessionId, boolean active, LocalDateTime requestedStart, LocalDateTime requestedEnd) {
        ensureCampusSessionsIfMissing();
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));
        session.setActive(active);
        if (active) {
            LocalDateTime now = nowInRwanda();
            LocalDateTime start = requestedStart != null ? requestedStart : now;
            LocalDateTime end = requestedEnd != null ? requestedEnd : now.plusHours(1);
            validateOpenRange(start, end, now, "Attendance");
            session.setStartsAt(start);
            session.setEndsAt(end);
            session.setCancelled(false);
        } else {
            session.setCancelled(true);
        }
        session = sessionRepository.save(session);
        return toSessionResponse(session);
    }

    @Transactional
    public AttendanceSessionResponse createSpecialSession(String title, String campusCode, LocalDateTime startsAt, Integer durationMinutes) {
        if (startsAt == null) {
            throw new IllegalArgumentException("Start date and time are required.");
        }
        int minutes = durationMinutes != null ? durationMinutes : 60;
        if (minutes < 15) {
            throw new IllegalArgumentException("Attendance duration must be at least 15 minutes.");
        }
        if (minutes > 720) {
            throw new IllegalArgumentException("Attendance duration cannot exceed 12 hours.");
        }

        LocalDateTime endsAt = startsAt.plusMinutes(minutes);
        List<AttendanceSessionResponse> created = createSpecialSessions(
                title,
                campusCode,
                List.of(new SpecialSessionSlot(startsAt.toLocalDate(), startsAt.toLocalTime(), endsAt.toLocalTime()))
        );
        return created.get(0);
    }

    @Transactional
    public List<AttendanceSessionResponse> createSpecialSessions(String title, String campusCode, List<SpecialSessionSlot> slots) {
        ensureCampusSessionsIfMissing();
        String normalizedTitle = validateSpecialTitle(title);
        if (slots == null || slots.isEmpty()) {
            throw new IllegalArgumentException("At least one attendance time slot is required.");
        }
        if (slots.size() > 30) {
            throw new IllegalArgumentException("Special attendance cannot create more than 30 sessions at once.");
        }

        LocalDateTime now = nowInRwanda();
        AcademicTerm term = resolveActiveTerm();
        List<Campus> campuses = resolveCampuses(campusCode);
        List<AttendanceSessionResponse> responses = new ArrayList<>();
        String specialGroupKey = UUID.randomUUID().toString();
        for (SpecialSessionSlot slot : slots) {
            if (slot == null || slot.date() == null || slot.startsAt() == null || slot.endsAt() == null) {
                throw new IllegalArgumentException("Every special attendance slot needs date, start time, and end time.");
            }
            LocalDateTime start = LocalDateTime.of(slot.date(), slot.startsAt());
            LocalDateTime end = LocalDateTime.of(slot.date(), slot.endsAt());
            validateOpenRange(start, end, now, "Special attendance");
            String sessionTitle = buildSpecialSessionTitle(normalizedTitle, start, end);
            for (Campus campus : campuses) {
                AttendanceSession session = buildCampusSession(sessionTitle, campus, term, start, end, false);
                session.setActive(!now.isBefore(start) && now.isBefore(end));
                session.setSpecialGroupKey(specialGroupKey);
                responses.add(toSessionResponse(sessionRepository.save(session)));
            }
        }
        return responses;
    }

    @Transactional
    public int deleteSpecialSessionGroup(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));
        if (Boolean.TRUE.equals(session.getDefaultWeekly())) {
            throw new IllegalArgumentException("Default weekly attendance sessions cannot be deleted.");
        }
        String groupKey = safeTrim(session.getSpecialGroupKey());
        List<AttendanceSession> sessionsToDelete = isBlank(groupKey)
                ? findLegacySpecialSessionGroup(session)
                : sessionRepository.findBySpecialGroupKey(groupKey);
        if (sessionsToDelete.isEmpty()) {
            sessionsToDelete = List.of(session);
        }
        List<Long> sessionIds = sessionsToDelete.stream()
                .map(AttendanceSession::getId)
                .filter(id -> id != null)
                .toList();
        if (!sessionIds.isEmpty()) {
            recordRepository.deleteAll(recordRepository.findBySessionIdIn(sessionIds));
        }
        sessionRepository.deleteAll(sessionsToDelete);
        return sessionsToDelete.size();
    }

    private List<AttendanceSession> findLegacySpecialSessionGroup(AttendanceSession session) {
        String baseTitle = specialBaseTitle(session.getTitle());
        if (isBlank(baseTitle)) {
            return List.of(session);
        }
        return sessionRepository.findAll().stream()
                .filter(candidate -> !Boolean.TRUE.equals(candidate.getDefaultWeekly()))
                .filter(candidate -> isBlank(candidate.getSpecialGroupKey()))
                .filter(candidate -> {
                    String title = safeTrim(candidate.getTitle());
                    return baseTitle.equals(specialBaseTitle(title));
                })
                .toList();
    }

    private String specialBaseTitle(String title) {
        String value = safeTrim(title);
        if (isBlank(value)) {
            return "";
        }
        int separator = value.indexOf(" - ");
        return separator > 0 ? value.substring(0, separator) : value;
    }

    private void validateOpenRange(LocalDateTime start, LocalDateTime end, LocalDateTime now, String label) {
        if (start == null || end == null) {
            throw new IllegalArgumentException(label + " start and end date are required.");
        }
        if (start.isBefore(now.minusMinutes(1))) {
            throw new IllegalArgumentException(label + " start date cannot be in the past.");
        }
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException(label + " end date must be after the start date.");
        }
        if (end.isAfter(start.plusMonths(1))) {
            throw new IllegalArgumentException(label + " range cannot exceed one month.");
        }
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> listRecords(String studentNumber) {
        if (studentNumber == null || studentNumber.isBlank()) {
            throw new IllegalArgumentException("studentNumber is required.");
        }
        return recordRepository.findByStudentStudentNumber(studentNumber.trim()).stream()
                .map(this::toRecordResponse)
                .toList();
    }

    @Transactional
    public AttendanceRecordResponse checkIn(AttendanceCheckInRequest request, String clientIp) {
        autoCloseExpiredSessions();
        if (request == null || request.getSessionId() == null || isBlank(request.getStudentNumber()) || isBlank(request.getMethod())) {
            throw new IllegalArgumentException("studentNumber, sessionId, and method are required.");
        }

        StudentProfile student = studentProfileRepository.findByStudentNumber(request.getStudentNumber().trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        AttendanceSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        if (!Boolean.TRUE.equals(session.getActive())) {
            throw new IllegalArgumentException("Session is not active.");
        }

        LocalDateTime now = nowInRwanda();
        if (now.isBefore(session.getStartsAt()) || now.isAfter(session.getEndsAt())) {
            throw new IllegalArgumentException("Session is not currently open for check-in.");
        }

        AttendanceMethod method = parseMethod(request.getMethod());
        Optional<AttendanceRecord> existingRecord = recordRepository.findByStudentIdAndSessionId(student.getId(), session.getId());
        if (existingRecord.isPresent() && existingRecord.get().getStatus() == AttendanceStatus.PRESENT) {
            AttendanceRecord record = existingRecord.get();
            if (record.getMethod() != null && record.getMethod() != method) {
                throw new IllegalArgumentException("Attendance is already confirmed for this session using " + record.getMethod().name() + ".");
            }
            return toRecordResponse(record);
        }

        String wifiSsid = method == AttendanceMethod.WIFI ? safeTrim(request.getWifiSsid()) : null;
        if (method == AttendanceMethod.WIFI && isBlank(wifiSsid)) {
            throw new IllegalArgumentException("wifiSsid is required for Wi-Fi check-in.");
        }
        if (method == AttendanceMethod.WIFI && enforceNetworkForWifi && !isIpAllowed(clientIp)) {
            throw new IllegalArgumentException("Wi-Fi check-in is only allowed on campus network.");
        }

        if (method == AttendanceMethod.MANUAL) {
            if (isBlank(request.getQrToken())) {
                throw new IllegalArgumentException("qrToken is required for QR check-in.");
            }
            validateQrToken(request.getQrToken().trim(), session);
        }

        if (method == AttendanceMethod.BIOMETRIC) {
            validateBiometricProof(request);
        }

        if (method == AttendanceMethod.MANUAL || method == AttendanceMethod.BIOMETRIC) {
            validateLocationProof(request, method == AttendanceMethod.BIOMETRIC ? "Biometric" : "QR");
            validateCampusGeofence(session, request.getLatitude(), request.getLongitude());
        }

        String normalizedDeviceInfo = safeTrim(request.getDeviceInfo());
        if (isReliableDeviceIdentifier(normalizedDeviceInfo)) {
            Optional<AttendanceRecord> existingByDevice = recordRepository.findBySessionIdAndDeviceInfo(
                    session.getId(),
                    normalizedDeviceInfo
            );
            if (existingByDevice.isPresent()) {
                AttendanceRecord otherRecord = existingByDevice.get();
                if (otherRecord.getStudent() != null
                        && student.getId() != null
                        && !student.getId().equals(otherRecord.getStudent().getId())) {
                    throw new IllegalArgumentException("This device has already been used for attendance in this session.");
                }
            }
        }

        AttendanceRecord record = existingRecord
                .orElseGet(AttendanceRecord::new);
        record.setStudent(student);
        record.setSession(session);
        record.setCheckInAt(now);
        record.setMethod(method);
        record.setStatus(AttendanceStatus.PRESENT);
        record.setVerificationStatus(AttendanceVerificationStatus.CONFIRMED);
        record.setWifiSsid(wifiSsid);
        record.setDeviceInfo(normalizedDeviceInfo);
        record.setIpAddress(safeTrim(clientIp));
        record.setAbsenceReason(null);
        record.setAbsenceDocumentPath(null);
        record.setAbsenceDocumentName(null);

        record = recordRepository.save(record);
        return toRecordResponse(record);
    }

    @Transactional
    public AttendanceRecordResponse submitAbsence(String studentNumber, Long sessionId, String absenceReason, MultipartFile supportingDocument) {
        autoCloseExpiredSessions();
        if (isBlank(studentNumber) || sessionId == null || isBlank(absenceReason)) {
            throw new IllegalArgumentException("studentNumber, sessionId, and absence reason are required.");
        }

        String normalizedReason = safeTrim(absenceReason);
        if (normalizedReason.length() > 1000) {
            throw new IllegalArgumentException("Absence reason cannot exceed 1000 characters.");
        }

        StudentProfile student = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        Optional<AttendanceRecord> existingRecord = recordRepository.findByStudentIdAndSessionId(student.getId(), session.getId());
        if (existingRecord.isPresent() && existingRecord.get().getStatus() == AttendanceStatus.PRESENT) {
            throw new IllegalArgumentException("Attendance is already confirmed for this session.");
        }

        AttendanceRecord record = existingRecord.orElseGet(AttendanceRecord::new);
        record.setStudent(student);
        record.setSession(session);
        record.setCheckInAt(null);
        record.setMethod(null);
        record.setStatus(AttendanceStatus.ABSENT);
        record.setVerificationStatus(AttendanceVerificationStatus.PENDING);
        record.setAbsenceReason(normalizedReason);
        record.setNotes(normalizedReason);
        record.setWifiSsid(null);
        record.setDeviceInfo(null);
        record.setIpAddress(null);
        if (supportingDocument != null && !supportingDocument.isEmpty()) {
            validateAbsenceDocument(supportingDocument);
            record.setAbsenceDocumentPath(storeAbsenceDocument(supportingDocument));
            record.setAbsenceDocumentName(safeOriginalFilename(supportingDocument));
        }

        record = recordRepository.save(record);
        return toRecordResponse(record);
    }

    @Transactional(readOnly = true)
    public Resource loadAbsenceDocument(Long recordId) {
        AttendanceRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Record not found."));
        if (isBlank(record.getAbsenceDocumentPath())) {
            throw new IllegalArgumentException("Absence supporting document is not available.");
        }
        try {
            Path path = Paths.get(record.getAbsenceDocumentPath()).toAbsolutePath().normalize();
            if (!path.startsWith(absenceUploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("Absence supporting document is not available.");
            }
            return resource;
        } catch (IOException ex) {
            throw new IllegalArgumentException("Absence supporting document is not available.");
        }
    }

    @Transactional(readOnly = true)
    public boolean hasStudentCheckedIn(Long sessionId, String studentNumber) {
        if (sessionId == null || isBlank(studentNumber)) {
            throw new IllegalArgumentException("sessionId and studentNumber are required.");
        }
        StudentProfile student = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));
        return recordRepository.findByStudentIdAndSessionId(student.getId(), sessionId)
                .filter(record -> record.getStatus() == AttendanceStatus.PRESENT)
                .isPresent();
    }

    @Transactional(readOnly = true)
    public AttendanceQrTokenResponse generateSessionQrToken(Long sessionId) {
        autoCloseExpiredSessions();
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        if (!Boolean.TRUE.equals(session.getActive())) {
            throw new IllegalArgumentException("Session is not active.");
        }

        LocalDateTime now = nowInRwanda();
        LocalDateTime expiresAt = now.plusMinutes(Math.max(1, qrTtlMinutes));
        String campus = session.getCampus() != null ? safeTrim(session.getCampus().getName()) : null;
        String token = signQrToken(session.getId(), campus, expiresAt);
        String payload = qrFrontendBaseUrl + "/?attendanceQr="
                + URLEncoder.encode(token, StandardCharsets.UTF_8)
                + "&attendanceSession="
                + session.getId();

        return new AttendanceQrTokenResponse(
                session.getId(),
                session.getTitle(),
                campus != null ? campus : "",
                token,
                payload,
                expiresAt.toString()
        );
    }

    @Transactional
    public AttendanceQrTokenResponse generateActiveSessionQrToken() {
        autoCloseExpiredSessions();
        List<AttendanceSession> activeSessions = sessionRepository.findByActiveTrue();
        if (activeSessions.isEmpty()) {
            throw new IllegalArgumentException("No active session available.");
        }
        AttendanceSession activeSession = activeSessions.stream()
                .min((a, b) -> a.getStartsAt().compareTo(b.getStartsAt()))
                .orElse(activeSessions.get(0));
        return generateSessionQrToken(activeSession.getId());
    }

    @Transactional
    public List<AttendanceRecordAdminResponse> listAdminRecords(Long sessionId, String method, String status, String verificationStatus) {
        autoCloseExpiredSessions();
        List<AttendanceRecord> records = recordRepository.findAll();
        if (sessionId != null) {
            records = records.stream()
                    .filter(r -> r.getSession() != null && sessionId.equals(r.getSession().getId()))
                    .toList();
        }
        if (method != null && !method.isBlank()) {
            AttendanceMethod parsed = parseMethod(method);
            records = records.stream()
                    .filter(r -> r.getMethod() == parsed)
                    .toList();
        }
        if (status != null && !status.isBlank()) {
            AttendanceStatus parsed = AttendanceStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            records = records.stream()
                    .filter(r -> r.getStatus() == parsed)
                    .toList();
        }
        if (verificationStatus != null && !verificationStatus.isBlank()) {
            AttendanceVerificationStatus parsed = AttendanceVerificationStatus.valueOf(verificationStatus.trim().toUpperCase(Locale.ROOT));
            records = records.stream()
                    .filter(r -> r.getVerificationStatus() == parsed)
                    .toList();
        }

        return records.stream().map(this::toAdminResponse).toList();
    }

    @Transactional
    public AttendanceRecordAdminResponse verifyRecord(Long recordId, AttendanceVerificationRequest request) {
        if (request == null || isBlank(request.getDecision())) {
            throw new IllegalArgumentException("decision is required.");
        }

        AttendanceRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Record not found."));

        AttendanceVerificationStatus status = parseVerificationDecision(request.getDecision());
        record.setVerificationStatus(status);
        record.setVerificationNotes(safeTrim(request.getNotes()));
        record.setVerifiedAt(nowInRwanda());

        if (request.getReviewerUserId() != null) {
            UserAccount reviewer = userAccountRepository.findById(request.getReviewerUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Reviewer not found."));
            record.setVerifiedBy(reviewer);
        }

        record = recordRepository.save(record);
        return toAdminResponse(record);
    }

    @Transactional(readOnly = true)
    public byte[] buildSessionPresentReportPdf(Long sessionId) {
        if (sessionId == null) {
            throw new IllegalArgumentException("sessionId is required.");
        }
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        List<AttendanceRecordAdminResponse> records = recordRepository.findAll().stream()
                .filter(r -> r.getSession() != null && sessionId.equals(r.getSession().getId()))
                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT)
                .map(this::toAdminResponse)
                .toList();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 24f, 24f, 26f, 26f);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD);
            Font bodyFont = new Font(Font.HELVETICA, 9, Font.NORMAL);
            Font mutedFont = new Font(Font.HELVETICA, 9, Font.ITALIC);

            Paragraph title = new Paragraph("Attendance Daily Report - Present Students", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(8f);
            document.add(title);

            String sessionMeta = "Session: " + safeValue(session.getTitle())
                    + " | Campus: " + (session.getCampus() != null ? safeValue(session.getCampus().getName()) : "N/A")
                    + " | Date: " + nowInRwanda().toLocalDate();
            Paragraph meta = new Paragraph(sessionMeta, bodyFont);
            meta.setSpacingAfter(6f);
            document.add(meta);

            Paragraph count = new Paragraph("Total present students: " + records.size(), bodyFont);
            count.setSpacingAfter(10f);
            document.add(count);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100f);
            table.setWidths(new float[]{0.8f, 2.3f, 1.6f, 2.2f, 1.2f, 1.6f});

            addHeaderCell(table, "#");
            addHeaderCell(table, "Student Name");
            addHeaderCell(table, "Student ID");
            addHeaderCell(table, "Check-in Time");
            addHeaderCell(table, "Method");
            addHeaderCell(table, "Verification");

            int index = 1;
            for (AttendanceRecordAdminResponse item : records) {
                addBodyCell(table, String.valueOf(index++));
                addBodyCell(table, safeValue(item.getStudentName()));
                addBodyCell(table, safeValue(item.getStudentNumber()));
                addBodyCell(table, safeValue(item.getCheckInAt()));
                addBodyCell(table, safeValue(item.getMethod()));
                addBodyCell(table, safeValue(item.getVerificationStatus()));
            }

            if (records.isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No present students found for this session.", mutedFont));
                empty.setColspan(6);
                empty.setHorizontalAlignment(Element.ALIGN_CENTER);
                empty.setPadding(8f);
                table.addCell(empty);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException ex) {
            throw new IllegalArgumentException("Failed to generate attendance PDF report.");
        }
    }

    private AttendanceRecordResponse toRecordResponse(AttendanceRecord record) {
        String date = record.getCheckInAt() != null
                ? record.getCheckInAt().toLocalDate().toString()
                : "";
        String time = record.getCheckInAt() != null
                ? record.getCheckInAt().format(DateTimeFormatter.ofPattern("HH:mm"))
                : "-";
        String location = record.getSession() != null ? record.getSession().getTitle() : "";
        String method = record.getMethod() != null ? record.getMethod().name() : "-";
        String status = record.getStatus() != null ? record.getStatus().name() : AttendanceStatus.ABSENT.name();

        return new AttendanceRecordResponse(
                record.getId(),
                record.getSession() != null ? record.getSession().getId() : null,
                date,
                location,
                time,
                method,
                status,
                record.getVerificationStatus() != null ? record.getVerificationStatus().name() : AttendanceVerificationStatus.PENDING.name(),
                record.getWifiSsid(),
                record.getAbsenceReason(),
                record.getAbsenceDocumentName(),
                !isBlank(record.getAbsenceDocumentPath())
        );
    }

    private AttendanceRecordAdminResponse toAdminResponse(AttendanceRecord record) {
        String studentName = record.getStudent() != null && record.getStudent().getUserAccount() != null
                ? record.getStudent().getUserAccount().getFirstName() + " " + record.getStudent().getUserAccount().getLastName()
                : "";
        String studentNumber = record.getStudent() != null ? record.getStudent().getStudentNumber() : "";
        String sessionTitle = record.getSession() != null ? record.getSession().getTitle() : "";
        String campus = record.getSession() != null && record.getSession().getCampus() != null
                ? record.getSession().getCampus().getName()
                : "";
        String checkInAt = record.getCheckInAt() != null
                ? record.getCheckInAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                : "";

        return new AttendanceRecordAdminResponse(
                record.getId(),
                record.getSession() != null ? record.getSession().getId() : null,
                studentName,
                studentNumber,
                sessionTitle,
                campus,
                checkInAt,
                record.getMethod() != null ? record.getMethod().name() : "",
                record.getStatus() != null ? record.getStatus().name() : AttendanceStatus.ABSENT.name(),
                record.getVerificationStatus() != null ? record.getVerificationStatus().name() : AttendanceVerificationStatus.PENDING.name(),
                record.getWifiSsid(),
                record.getIpAddress(),
                record.getDeviceInfo(),
                record.getAbsenceReason(),
                record.getAbsenceDocumentName(),
                !isBlank(record.getAbsenceDocumentPath())
        );
    }

    private AttendanceMethod parseMethod(String method) {
        try {
            return AttendanceMethod.valueOf(method.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid attendance method.");
        }
    }

    private AttendanceVerificationStatus parseVerificationDecision(String decision) {
        try {
            return AttendanceVerificationStatus.valueOf(decision.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid verification decision.");
        }
    }

    private void validateAbsenceDocument(MultipartFile document) {
        String contentType = document.getContentType() != null ? document.getContentType().toLowerCase(Locale.ROOT) : "";
        boolean valid = contentType.equals("application/pdf") || contentType.equals("image/jpeg") || contentType.equals("image/png");
        if (!valid) {
            throw new IllegalArgumentException("Supporting document must be PDF, JPG, or PNG.");
        }
        if (document.getSize() > 5L * 1024L * 1024L) {
            throw new IllegalArgumentException("Supporting document must be 5MB or smaller.");
        }
    }

    private String storeAbsenceDocument(MultipartFile document) {
        try {
            Files.createDirectories(absenceUploadDir);
            String filename = "attendance-absence-" + System.currentTimeMillis() + "-" + safeOriginalFilename(document);
            Path destination = absenceUploadDir.resolve(filename).normalize();
            if (!destination.startsWith(absenceUploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(document.getInputStream(), destination);
            return destination.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store supporting document. Check server write permissions.");
        }
    }

    private String safeOriginalFilename(MultipartFile file) {
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "supporting-document";
        return original.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private Path resolveUploadDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "attendance-absences").toAbsolutePath().normalize();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String safeTrim(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private String safeValue(String value) {
        return value == null ? "-" : value;
    }

    private boolean isReliableDeviceIdentifier(String value) {
        return value != null && value.startsWith("aucasa-device:");
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.BOLD)));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setBackgroundColor(new java.awt.Color(228, 236, 247));
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 8, Font.NORMAL)));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private boolean isIpAllowed(String clientIp) {
        if (isBlank(clientIp)) {
            return false;
        }
        if (allowedCidrs.isEmpty()) {
            return true;
        }
        for (String cidr : allowedCidrs) {
            if (cidrMatches(clientIp, cidr)) {
                return true;
            }
        }
        return false;
    }

    private void validateBiometricProof(AttendanceCheckInRequest request) {
        if (!Boolean.TRUE.equals(request.getBiometricVerified())) {
            throw new IllegalArgumentException("Biometric verification is required.");
        }
        if (isBlank(request.getBiometricProvider())) {
            throw new IllegalArgumentException("biometricProvider is required for biometric check-in.");
        }
        if (isBlank(request.getBiometricVerifiedAt())) {
            throw new IllegalArgumentException("biometricVerifiedAt is required for biometric check-in.");
        }

        LocalDateTime verifiedAt = parseDateTime(request.getBiometricVerifiedAt().trim());
        LocalDateTime now = nowInRwanda();
        if (verifiedAt.isAfter(now.plusSeconds(10))) {
            throw new IllegalArgumentException("Invalid biometric verification time.");
        }
        if (verifiedAt.isBefore(now.minusSeconds(Math.max(1, biometricMaxAgeSeconds)))) {
            throw new IllegalArgumentException("Biometric verification has expired. Please try again.");
        }
    }

    private void validateLocationProof(AttendanceCheckInRequest request, String methodLabel) {
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new IllegalArgumentException("Latitude and longitude are required for " + methodLabel + " check-in.");
        }
        if (enforceMockLocationCheck && Boolean.TRUE.equals(request.getMockLocation())) {
            throw new IllegalArgumentException("Mock location is not allowed for attendance check-in.");
        }
        if (request.getLocationAccuracyMeters() != null
                && request.getLocationAccuracyMeters() > Math.max(1d, maxLocationAccuracyMeters)) {
            throw new IllegalArgumentException("Location accuracy is too low for attendance verification.");
        }
    }

    private boolean cidrMatches(String ip, String cidr) {
        try {
            String[] parts = cidr.split("/");
            InetAddress inetAddress = InetAddress.getByName(ip);
            InetAddress network = InetAddress.getByName(parts[0]);
            int prefix = Integer.parseInt(parts[1]);

            BigInteger ipVal = new BigInteger(1, inetAddress.getAddress());
            BigInteger netVal = new BigInteger(1, network.getAddress());
            BigInteger mask = prefixToMask(inetAddress.getAddress().length * 8, prefix);

            return ipVal.and(mask).equals(netVal.and(mask));
        } catch (UnknownHostException | NumberFormatException | ArrayIndexOutOfBoundsException ex) {
            return false;
        }
    }

    private BigInteger prefixToMask(int bits, int prefix) {
        if (prefix <= 0) {
            return BigInteger.ZERO;
        }
        BigInteger mask = BigInteger.ONE.shiftLeft(bits).subtract(BigInteger.ONE)
                .xor(BigInteger.ONE.shiftLeft(bits - prefix).subtract(BigInteger.ONE));
        return mask;
    }

    private String signQrToken(Long sessionId, String campusName, LocalDateTime expiresAt) {
        long exp = expiresAt.atZone(RWANDA_ZONE).toEpochSecond();
        String payload = sessionId + ":" + exp + ":" + normalizeCampus(campusName);
        String sig = hmacSha256Base64Url(payload, qrSecret);
        return sessionId + "." + exp + "." + sig;
    }

    private void validateQrToken(String rawTokenOrPayload, AttendanceSession expectedSession) {
        String token = rawTokenOrPayload.startsWith("AUCASA_QR:")
                ? rawTokenOrPayload.substring("AUCASA_QR:".length()).trim()
                : rawTokenOrPayload.trim();
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid QR token format.");
        }

        long sessionId;
        long exp;
        try {
            sessionId = Long.parseLong(parts[0]);
            exp = Long.parseLong(parts[1]);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid QR token values.");
        }

        if (!sessionIdEquals(expectedSession, sessionId)) {
            throw new IllegalArgumentException("QR token does not match selected session.");
        }

        long nowEpoch = nowInRwanda().atZone(RWANDA_ZONE).toEpochSecond();
        if (nowEpoch > exp) {
            throw new IllegalArgumentException("QR token has expired.");
        }

        String campus = expectedSession.getCampus() != null ? safeTrim(expectedSession.getCampus().getName()) : null;
        String expectedPayload = sessionId + ":" + exp + ":" + normalizeCampus(campus);
        String expectedSig = hmacSha256Base64Url(expectedPayload, qrSecret);

        if (!MessageDigest.isEqual(expectedSig.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid QR token signature.");
        }
    }

    private void validateCampusGeofence(AttendanceSession session, double latitude, double longitude) {
        String campusName = session.getCampus() != null ? safeTrim(session.getCampus().getName()) : null;
        if (isBlank(campusName)) {
            throw new IllegalArgumentException("Session campus is not configured.");
        }

        GeoFence geoFence = resolveGeoFence(campusName);
        if (geoFence == null) {
            throw new IllegalArgumentException("Campus geofence is not configured.");
        }

        double distance = distanceMeters(latitude, longitude, geoFence.lat(), geoFence.lng());
        if (distance > geoFence.radiusMeters()) {
            throw new IllegalArgumentException("You are outside " + campusName + " campus boundary.");
        }
    }

    private GeoFence resolveGeoFence(String campusName) {
        String normalized = normalizeCampus(campusName);
        if (normalized.contains("gishushu")) {
            return new GeoFence(-1.9559, 30.1041, 2000);
        }
        if (normalized.contains("masoro")) {
            return new GeoFence(-1.9452, 30.1431, 2000);
        }
        return null;
    }

    private double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double earth = 6371000d;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earth * c;
    }

    private String normalizeCampus(String campusName) {
        return isBlank(campusName) ? "" : campusName.trim().toLowerCase(Locale.ROOT);
    }

    private boolean sessionIdEquals(AttendanceSession session, long sessionId) {
        return session != null && session.getId() != null && session.getId().equals(sessionId);
    }

    private String hmacSha256Base64Url(String value, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to generate QR token.");
        }
    }

    private LocalDateTime parseDateTime(String value) {
        try {
            return OffsetDateTime.parse(value).atZoneSameInstant(RWANDA_ZONE).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid biometricVerifiedAt timestamp format.");
            }
        }
    }

    private LocalDateTime nowInRwanda() {
        return LocalDateTime.now(RWANDA_ZONE);
    }

    @Transactional
    protected void autoCloseExpiredSessions() {
        LocalDateTime now = nowInRwanda();
        List<AttendanceSession> sessions = sessionRepository.findAll();
        if (sessions == null || sessions.isEmpty()) {
            return;
        }
        boolean changed = false;
        for (AttendanceSession session : sessions) {
            if (Boolean.TRUE.equals(session.getCancelled()) || session.getStartsAt() == null || session.getEndsAt() == null) {
                continue;
            }
            boolean shouldBeActive = !now.isBefore(session.getStartsAt()) && now.isBefore(session.getEndsAt());
            if (session.getEndsAt().isBefore(now) || session.getEndsAt().isEqual(now)) {
                shouldBeActive = false;
            }
            if (!Boolean.valueOf(shouldBeActive).equals(session.getActive())) {
                session.setActive(shouldBeActive);
                changed = true;
            }
        }
        if (changed) {
            sessionRepository.saveAll(sessions);
        }
    }

    private void closeExpiredActiveSessions() {
        LocalDateTime now = nowInRwanda();
        List<AttendanceSession> activeSessions = sessionRepository.findByActiveTrue();
        boolean changed = false;
        for (AttendanceSession session : activeSessions) {
            if (session.getEndsAt() != null && !session.getEndsAt().isAfter(now)) {
                session.setActive(false);
                changed = true;
            }
        }
        if (changed) {
            sessionRepository.saveAll(activeSessions);
        }
    }

    private void ensureCampusSessionsIfMissing() {
        AcademicTerm term = resolveActiveTerm();
        Campus masoro = resolveCampus("MAS");
        Campus gishushu = resolveCampus("GIS");

        LocalDateTime now = nowInRwanda();
        ensureWeeklyGeneralAssembly(MASORO_GENERAL_ASSEMBLY_TITLE, masoro, term, now, DayOfWeek.TUESDAY, LocalTime.of(10, 0));
        ensureWeeklyGeneralAssembly(GISHUSHU_GENERAL_ASSEMBLY_TITLE, gishushu, term, now, DayOfWeek.WEDNESDAY, LocalTime.of(17, 0));
    }

    private Campus createCampus(String code, String name) {
        Campus campus = new Campus();
        campus.setCode(code);
        campus.setName(name);
        return campusRepository.save(campus);
    }

    private AcademicTerm resolveActiveTerm() {
        return academicTermRepository.findByActiveTrue()
                .orElseGet(() -> {
                    AcademicTerm t = new AcademicTerm();
                    t.setName("Current Semester");
                    t.setAcademicYear(String.valueOf(LocalDate.now(RWANDA_ZONE).getYear()));
                    t.setSemesterNumber(1);
                    t.setStartDate(LocalDate.now(RWANDA_ZONE));
                    t.setEndDate(LocalDate.now(RWANDA_ZONE).plusMonths(4));
                    t.setActive(true);
                    return academicTermRepository.save(t);
                });
    }

    private Campus resolveCampus(String campusCode) {
        String normalized = safeTrim(campusCode);
        if (isBlank(normalized)) {
            throw new IllegalArgumentException("Campus is required.");
        }
        String upperCode = normalized.toUpperCase(Locale.ROOT);
        if (upperCode.startsWith("MAS") || normalized.toLowerCase(Locale.ROOT).contains("masoro")) {
            return campusRepository.findByCode("MAS")
                    .orElseGet(() -> createCampus("MAS", "Masoro Campus"));
        }
        if (upperCode.startsWith("GIS") || normalized.toLowerCase(Locale.ROOT).contains("gishushu")) {
            return campusRepository.findByCode("GIS")
                    .orElseGet(() -> createCampus("GIS", "Gishushu Campus"));
        }
        throw new IllegalArgumentException("Unsupported campus. Choose Masoro or Gishushu.");
    }

    private List<Campus> resolveCampuses(String campusCode) {
        String normalized = safeTrim(campusCode);
        if (isBlank(normalized)) {
            throw new IllegalArgumentException("Campus is required.");
        }
        if ("ALL".equalsIgnoreCase(normalized) || normalized.toLowerCase(Locale.ROOT).contains("all")) {
            return List.of(resolveCampus("GIS"), resolveCampus("MAS"));
        }
        return List.of(resolveCampus(normalized));
    }

    private String validateSpecialTitle(String title) {
        String normalizedTitle = safeTrim(title);
        if (isBlank(normalizedTitle)) {
            throw new IllegalArgumentException("Attendance title is required.");
        }
        if (normalizedTitle.length() > 140) {
            throw new IllegalArgumentException("Attendance title cannot exceed 140 characters.");
        }
        return normalizedTitle;
    }

    private String buildSpecialSessionTitle(String baseTitle, LocalDateTime start, LocalDateTime end) {
        String suffix = start.format(DateTimeFormatter.ofPattern("EEE MMM dd HH:mm", Locale.ENGLISH))
                + "-"
                + end.format(DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH));
        String title = baseTitle + " - " + suffix;
        return title.length() <= 180 ? title : title.substring(0, 180);
    }

    private AttendanceSessionResponse toSessionResponse(AttendanceSession session) {
        return new AttendanceSessionResponse(
                session.getId(),
                session.getTitle(),
                session.getCampus() != null ? session.getCampus().getName() : "",
                session.getStartsAt(),
                session.getEndsAt(),
                Boolean.TRUE.equals(session.getActive()),
                Boolean.TRUE.equals(session.getCancelled()),
                Boolean.TRUE.equals(session.getDefaultWeekly()),
                session.getSpecialGroupKey()
        );
    }

    private void ensureWeeklyGeneralAssembly(
            String title,
            Campus campus,
            AcademicTerm term,
            LocalDateTime now,
            DayOfWeek dayOfWeek,
            LocalTime startsAt
    ) {
        LocalDate sessionDate = now.toLocalDate().with(TemporalAdjusters.previousOrSame(dayOfWeek));
        LocalDateTime sessionStart = LocalDateTime.of(sessionDate, startsAt);
        LocalDateTime sessionEnd = sessionStart.plusHours(GENERAL_ASSEMBLY_DURATION_HOURS);

        if (now.isAfter(sessionEnd)) {
            LocalDate nextDate = now.toLocalDate().with(TemporalAdjusters.next(dayOfWeek));
            sessionStart = LocalDateTime.of(nextDate, startsAt);
            sessionEnd = sessionStart.plusHours(GENERAL_ASSEMBLY_DURATION_HOURS);
        }

        LocalDateTime dayStart = sessionStart.toLocalDate().atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1);
        LocalDateTime scheduledStart = sessionStart;
        LocalDateTime scheduledEnd = sessionEnd;
        AttendanceSession session = sessionRepository.findByTitleAndStartsAtBetween(title, dayStart, dayEnd)
                .stream()
                .findFirst()
                .orElseGet(() -> buildCampusSession(title, campus, term, scheduledStart, scheduledEnd, true));

        session.setTitle(title);
        session.setCampus(campus);
        session.setTerm(term);
        session.setDefaultWeekly(true);

        if (Boolean.TRUE.equals(session.getActive()) && !Boolean.TRUE.equals(session.getCancelled())) {
            sessionRepository.save(session);
            return;
        }

        session.setStartsAt(sessionStart);
        session.setEndsAt(sessionEnd);
        if (Boolean.TRUE.equals(session.getCancelled())) {
            session.setActive(false);
        } else {
            session.setActive(!now.isBefore(sessionStart) && now.isBefore(sessionEnd));
        }
        sessionRepository.save(session);
    }

    private AttendanceSession buildCampusSession(String title, Campus campus, AcademicTerm term, LocalDateTime start, LocalDateTime end, boolean defaultWeekly) {
        AttendanceSession session = new AttendanceSession();
        session.setTitle(title);
        session.setCampus(campus);
        session.setTerm(term);
        session.setStartsAt(start);
        session.setEndsAt(end);
        session.setActive(false);
        session.setCancelled(false);
        session.setDefaultWeekly(defaultWeekly);
        return session;
    }

    public record SpecialSessionSlot(LocalDate date, LocalTime startsAt, LocalTime endsAt) {
    }

    private record GeoFence(double lat, double lng, double radiusMeters) {
    }
}
