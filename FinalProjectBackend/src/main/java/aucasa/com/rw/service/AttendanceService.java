package aucasa.com.rw.service;

import aucasa.com.rw.domain.AttendanceRecord;
import aucasa.com.rw.domain.AttendanceSession;
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
import java.math.BigInteger;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceService {
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final List<String> allowedCidrs;
    private final boolean enforceNetworkForWifi;
    private final boolean enforceMockLocationCheck;
    private final double maxLocationAccuracyMeters;
    private final long biometricMaxAgeSeconds;
    private final String qrSecret;
    private final long qrTtlMinutes;
    private final String qrFrontendBaseUrl;

    public AttendanceService(
            AttendanceSessionRepository sessionRepository,
            AttendanceRecordRepository recordRepository,
            StudentProfileRepository studentProfileRepository,
            UserAccountRepository userAccountRepository,
            @Value("${app.attendance.allowed-cidrs:}") String allowedCidrs,
            @Value("${app.attendance.enforce-network:true}") boolean enforceNetworkForWifi,
            @Value("${app.attendance.enforce-mock-location-check:true}") boolean enforceMockLocationCheck,
            @Value("${app.attendance.max-location-accuracy-meters:50}") double maxLocationAccuracyMeters,
            @Value("${app.attendance.biometric-max-age-seconds:120}") long biometricMaxAgeSeconds,
            @Value("${app.attendance.qr-secret:aucasa-attendance-secret}") String qrSecret,
            @Value("${app.attendance.qr-ttl-minutes:20}") long qrTtlMinutes,
            @Value("${app.attendance.qr-frontend-base-url:https://localhost:5173}") String qrFrontendBaseUrl
    ) {
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userAccountRepository = userAccountRepository;
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
    }

    @Transactional
    public List<AttendanceSessionResponse> listSessions(boolean activeOnly) {
        autoCloseExpiredSessions();
        List<AttendanceSession> sessions = activeOnly ? sessionRepository.findByActiveTrue() : sessionRepository.findAll();
        return sessions.stream()
                .map(session -> new AttendanceSessionResponse(
                        session.getId(),
                        session.getTitle(),
                        session.getCampus() != null ? session.getCampus().getName() : "",
                        session.getStartsAt(),
                        session.getEndsAt(),
                        Boolean.TRUE.equals(session.getActive())
                ))
                .toList();
    }

    @Transactional
    public AttendanceSessionResponse toggleSessionActive(Long sessionId, boolean active) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));
        session.setActive(active);
        if (active) {
            LocalDateTime now = LocalDateTime.now();
            if (session.getEndsAt() == null || session.getEndsAt().isBefore(now)) {
                session.setStartsAt(now);
                session.setEndsAt(now.plusHours(1));
            }
        }
        session = sessionRepository.save(session);
        return new AttendanceSessionResponse(
                session.getId(),
                session.getTitle(),
                session.getCampus() != null ? session.getCampus().getName() : "",
                session.getStartsAt(),
                session.getEndsAt(),
                Boolean.TRUE.equals(session.getActive())
        );
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

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(session.getStartsAt()) || now.isAfter(session.getEndsAt())) {
            throw new IllegalArgumentException("Session is not currently open for check-in.");
        }

        AttendanceMethod method = parseMethod(request.getMethod());
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
        if (!isBlank(normalizedDeviceInfo)) {
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

        AttendanceRecord record = recordRepository.findByStudentIdAndSessionId(student.getId(), session.getId())
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

        record = recordRepository.save(record);
        return toRecordResponse(record);
    }

    @Transactional(readOnly = true)
    public AttendanceQrTokenResponse generateSessionQrToken(Long sessionId) {
        autoCloseExpiredSessions();
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        if (!Boolean.TRUE.equals(session.getActive())) {
            throw new IllegalArgumentException("Session is not active.");
        }

        LocalDateTime now = LocalDateTime.now();
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
        record.setVerifiedAt(LocalDateTime.now());

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
                    + " | Date: " + LocalDateTime.now().toLocalDate();
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
                date,
                location,
                time,
                method,
                status,
                record.getVerificationStatus() != null ? record.getVerificationStatus().name() : AttendanceVerificationStatus.PENDING.name(),
                record.getWifiSsid()
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
                record.getDeviceInfo()
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

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String safeTrim(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private String safeValue(String value) {
        return value == null ? "-" : value;
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
        LocalDateTime now = LocalDateTime.now();
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
        long exp = expiresAt.atZone(java.time.ZoneId.systemDefault()).toEpochSecond();
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

        long nowEpoch = LocalDateTime.now().atZone(java.time.ZoneId.systemDefault()).toEpochSecond();
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
            return OffsetDateTime.parse(value).atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid biometricVerifiedAt timestamp format.");
            }
        }
    }

    @Transactional
    protected void autoCloseExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        List<AttendanceSession> activeSessions = sessionRepository.findByActiveTrue();
        for (AttendanceSession session : activeSessions) {
            if (session.getEndsAt() != null && session.getEndsAt().isBefore(now)) {
                session.setActive(false);
            }
        }
        if (!activeSessions.isEmpty()) {
            sessionRepository.saveAll(activeSessions);
        }
    }

    private record GeoFence(double lat, double lng, double radiusMeters) {
    }
}
