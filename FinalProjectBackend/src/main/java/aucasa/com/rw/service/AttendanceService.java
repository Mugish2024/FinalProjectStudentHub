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
import aucasa.com.rw.dto.attendance.AttendanceSessionResponse;
import aucasa.com.rw.dto.attendance.AttendanceVerificationRequest;
import aucasa.com.rw.repository.AttendanceRecordRepository;
import aucasa.com.rw.repository.AttendanceSessionRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.math.BigInteger;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;
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

    public AttendanceService(
            AttendanceSessionRepository sessionRepository,
            AttendanceRecordRepository recordRepository,
            StudentProfileRepository studentProfileRepository,
            UserAccountRepository userAccountRepository,
            @Value("${app.attendance.allowed-cidrs:}") String allowedCidrs,
            @Value("${app.attendance.enforce-network:true}") boolean enforceNetworkForWifi
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
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionResponse> listSessions(boolean activeOnly) {
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

        AttendanceRecord record = recordRepository.findByStudentIdAndSessionId(student.getId(), session.getId())
                .orElseGet(AttendanceRecord::new);
        record.setStudent(student);
        record.setSession(session);
        record.setCheckInAt(now);
        record.setMethod(method);
        record.setStatus(AttendanceStatus.PRESENT);
        record.setVerificationStatus(AttendanceVerificationStatus.PENDING);
        record.setWifiSsid(wifiSsid);
        record.setDeviceInfo(safeTrim(request.getDeviceInfo()));
        record.setIpAddress(safeTrim(clientIp));

        record = recordRepository.save(record);
        return toRecordResponse(record);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordAdminResponse> listAdminRecords(Long sessionId, String method, String status, String verificationStatus) {
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
}
