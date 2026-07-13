package aucasa.com.rw.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import aucasa.com.rw.domain.AttendanceRecord;
import aucasa.com.rw.domain.AttendanceSession;
import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.Campus;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.enums.AttendanceMethod;
import aucasa.com.rw.domain.enums.AttendanceStatus;
import aucasa.com.rw.dto.attendance.AttendanceCheckInRequest;
import aucasa.com.rw.dto.attendance.AttendanceRecordResponse;
import aucasa.com.rw.repository.AttendanceRecordRepository;
import aucasa.com.rw.repository.AttendanceSessionRepository;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.CampusRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {
    private static final ZoneId RWANDA_ZONE = ZoneId.of("Africa/Kigali");

    @Mock
    private AttendanceSessionRepository sessionRepository;

    @Mock
    private AttendanceRecordRepository recordRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private AcademicTermRepository academicTermRepository;

    @Mock
    private CampusRepository campusRepository;

    private AttendanceService service;

    @BeforeEach
    void setUp() {
        service = new AttendanceService(
                sessionRepository,
                recordRepository,
                studentProfileRepository,
                userAccountRepository,
                academicTermRepository,
                campusRepository,
                "",
                true,
                true,
                50d,
                120,
                "secret",
                20,
                "http://localhost:5173",
                System.getProperty("java.io.tmpdir")
        );
    }

    @Test
    void checkInWithBiometricAndValidGeofenceSucceeds() {
        StudentProfile student = buildStudent(100L, "S12345");
        AttendanceSession session = buildSession(10L, "Masoro Campus");

        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setStudentNumber("S12345");
        request.setSessionId(10L);
        request.setMethod("BIOMETRIC");
        request.setLatitude(-1.9452);
        request.setLongitude(30.1431);
        request.setLocationAccuracyMeters(8d);
        request.setMockLocation(false);
        request.setBiometricVerified(true);
        request.setBiometricProvider("platform-webauthn");
        request.setBiometricVerifiedAt(nowInRwanda().toString());

        when(studentProfileRepository.findByStudentNumber("S12345")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(recordRepository.findByStudentIdAndSessionId(100L, 10L)).thenReturn(Optional.empty());
        when(recordRepository.save(any(AttendanceRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceRecordResponse response = service.checkIn(request, "127.0.0.1");

        assertEquals("PRESENT", response.getStatus());
        assertEquals("BIOMETRIC", response.getMethod());
    }

    @Test
    void checkInBiometricWithoutVerificationFails() {
        StudentProfile student = buildStudent(100L, "S12345");
        AttendanceSession session = buildSession(10L, "Masoro Campus");

        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setStudentNumber("S12345");
        request.setSessionId(10L);
        request.setMethod("BIOMETRIC");
        request.setLatitude(-1.9452);
        request.setLongitude(30.1431);
        request.setBiometricVerified(false);

        when(studentProfileRepository.findByStudentNumber("S12345")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.checkIn(request, "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("Biometric verification is required"));
    }

    @Test
    void checkInWithDifferentMethodAfterConfirmedAttendanceFails() {
        StudentProfile student = buildStudent(100L, "S12345");
        AttendanceSession session = buildSession(10L, "Masoro Campus");
        AttendanceRecord existing = new AttendanceRecord();
        existing.setStudent(student);
        existing.setSession(session);
        existing.setMethod(AttendanceMethod.BIOMETRIC);
        existing.setStatus(AttendanceStatus.PRESENT);
        existing.setCheckInAt(nowInRwanda().minusMinutes(5));

        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setStudentNumber("S12345");
        request.setSessionId(10L);
        request.setMethod("WIFI");
        request.setWifiSsid("AUCA");

        when(studentProfileRepository.findByStudentNumber("S12345")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(recordRepository.findByStudentIdAndSessionId(100L, 10L)).thenReturn(Optional.of(existing));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.checkIn(request, "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("already confirmed"));
    }

    @Test
    void checkInBiometricOutsideCampusFails() {
        StudentProfile student = buildStudent(100L, "S12345");
        AttendanceSession session = buildSession(10L, "Masoro Campus");

        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setStudentNumber("S12345");
        request.setSessionId(10L);
        request.setMethod("BIOMETRIC");
        request.setLatitude(-1.80);
        request.setLongitude(30.50);
        request.setLocationAccuracyMeters(10d);
        request.setBiometricVerified(true);
        request.setBiometricProvider("platform-webauthn");
        request.setBiometricVerifiedAt(nowInRwanda().toString());

        when(studentProfileRepository.findByStudentNumber("S12345")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.checkIn(request, "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("outside"));
    }

    @Test
    void closingNonDefaultSessionMarksCancelledSoAutoSyncDoesNotReopenIt() {
        AttendanceSession session = buildSession(10L, "Gishushu Campus");
        session.setTitle("Gishushu Attendance Session");
        session.setDefaultWeekly(false);
        session.setCancelled(false);

        when(academicTermRepository.findByActiveTrue()).thenReturn(Optional.of(new AcademicTerm()));
        when(campusRepository.findByCode("MAS")).thenReturn(Optional.of(buildCampus("MAS", "Masoro Campus")));
        when(campusRepository.findByCode("GIS")).thenReturn(Optional.of(buildCampus("GIS", "Gishushu Campus")));
        when(sessionRepository.findByTitleAndStartsAtBetween(any(), any(), any())).thenReturn(List.of());
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(AttendanceSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.toggleSessionActive(10L, false);

        assertEquals(false, session.getActive());
        assertEquals(true, session.getCancelled());
    }

    @Test
    void listSessionsCreatesWeeklyGeneralAssemblyDefaults() {
        AcademicTerm term = new AcademicTerm();
        term.setName("Current Semester");
        term.setAcademicYear("2026");
        term.setSemesterNumber(1);
        term.setStartDate(LocalDate.now().minusMonths(1));
        term.setEndDate(LocalDate.now().plusMonths(3));
        term.setActive(true);

        Campus masoro = buildCampus("MAS", "Masoro Campus");
        Campus gishushu = buildCampus("GIS", "Gishushu Campus");
        List<AttendanceSession> saved = new ArrayList<>();

        when(academicTermRepository.findByActiveTrue()).thenReturn(Optional.of(term));
        when(campusRepository.findByCode("MAS")).thenReturn(Optional.of(masoro));
        when(campusRepository.findByCode("GIS")).thenReturn(Optional.of(gishushu));
        when(sessionRepository.findByTitleAndStartsAtBetween(any(), any(), any())).thenReturn(List.of());
        when(sessionRepository.save(any(AttendanceSession.class))).thenAnswer(invocation -> {
            AttendanceSession session = invocation.getArgument(0);
            saved.add(session);
            return session;
        });
        when(sessionRepository.findAll()).thenAnswer(invocation -> saved);

        service.listSessions(false);

        AttendanceSession masoroSession = saved.stream()
                .filter(session -> "Masoro General Assembly".equals(session.getTitle()))
                .findFirst()
                .orElseThrow();
        AttendanceSession gishushuSession = saved.stream()
                .filter(session -> "Gishushu General Assembly".equals(session.getTitle()))
                .findFirst()
                .orElseThrow();

        assertEquals(DayOfWeek.TUESDAY, masoroSession.getStartsAt().getDayOfWeek());
        assertEquals(10, masoroSession.getStartsAt().getHour());
        assertEquals("Masoro Campus", masoroSession.getCampus().getName());
        assertEquals(DayOfWeek.WEDNESDAY, gishushuSession.getStartsAt().getDayOfWeek());
        assertEquals(17, gishushuSession.getStartsAt().getHour());
        assertEquals("Gishushu Campus", gishushuSession.getCampus().getName());
        assertTrue(Boolean.TRUE.equals(masoroSession.getDefaultWeekly()));
        assertTrue(Boolean.TRUE.equals(gishushuSession.getDefaultWeekly()));
    }

    @Test
    void listSessionsKeepsManuallyOpenedWeeklySessionRange() {
        AcademicTerm term = new AcademicTerm();
        term.setName("Current Semester");
        term.setAcademicYear("2026");
        term.setSemesterNumber(1);
        term.setStartDate(LocalDate.now().minusMonths(1));
        term.setEndDate(LocalDate.now().plusMonths(3));
        term.setActive(true);

        Campus masoro = buildCampus("MAS", "Masoro Campus");
        Campus gishushu = buildCampus("GIS", "Gishushu Campus");
        AttendanceSession gishushuSession = new AttendanceSession();
        ReflectionTestUtils.setField(gishushuSession, "id", 6L);
        gishushuSession.setTitle("Gishushu General Assembly");
        gishushuSession.setCampus(gishushu);
        gishushuSession.setTerm(term);
        gishushuSession.setStartsAt(nowInRwanda().minusMinutes(5));
        gishushuSession.setEndsAt(nowInRwanda().plusMinutes(55));
        gishushuSession.setActive(true);
        gishushuSession.setCancelled(false);
        gishushuSession.setDefaultWeekly(true);

        LocalDateTime openedStart = gishushuSession.getStartsAt();
        LocalDateTime openedEnd = gishushuSession.getEndsAt();

        when(academicTermRepository.findByActiveTrue()).thenReturn(Optional.of(term));
        when(campusRepository.findByCode("MAS")).thenReturn(Optional.of(masoro));
        when(campusRepository.findByCode("GIS")).thenReturn(Optional.of(gishushu));
        when(sessionRepository.findByTitleAndStartsAtBetween(any(), any(), any()))
                .thenReturn(List.of())
                .thenReturn(List.of(gishushuSession));
        when(sessionRepository.save(any(AttendanceSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(sessionRepository.findAll()).thenReturn(List.of(gishushuSession));

        service.listSessions(false);

        assertEquals(openedStart, gishushuSession.getStartsAt());
        assertEquals(openedEnd, gishushuSession.getEndsAt());
        assertTrue(Boolean.TRUE.equals(gishushuSession.getActive()));
    }

    private StudentProfile buildStudent(Long id, String studentNumber) {
        StudentProfile student = new StudentProfile();
        ReflectionTestUtils.setField(student, "id", id);
        student.setStudentNumber(studentNumber);
        return student;
    }

    private AttendanceSession buildSession(Long id, String campusName) {
        AttendanceSession session = new AttendanceSession();
        ReflectionTestUtils.setField(session, "id", id);
        session.setActive(true);
        session.setStartsAt(nowInRwanda().minusMinutes(30));
        session.setEndsAt(nowInRwanda().plusMinutes(30));

        Campus campus = new Campus();
        campus.setName(campusName);
        session.setCampus(campus);
        return session;
    }

    private Campus buildCampus(String code, String name) {
        Campus campus = new Campus();
        campus.setCode(code);
        campus.setName(name);
        return campus;
    }

    private LocalDateTime nowInRwanda() {
        return LocalDateTime.now(RWANDA_ZONE);
    }
}
