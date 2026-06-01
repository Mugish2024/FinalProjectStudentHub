package aucasa.com.rw.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import aucasa.com.rw.domain.AttendanceRecord;
import aucasa.com.rw.domain.AttendanceSession;
import aucasa.com.rw.domain.Campus;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.dto.attendance.AttendanceCheckInRequest;
import aucasa.com.rw.dto.attendance.AttendanceRecordResponse;
import aucasa.com.rw.repository.AttendanceRecordRepository;
import aucasa.com.rw.repository.AttendanceSessionRepository;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.CampusRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

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
                "http://localhost:5173"
        );
        when(sessionRepository.findByActiveTrue()).thenReturn(List.of());
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
        request.setBiometricVerifiedAt(LocalDateTime.now().toString());

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
        request.setBiometricVerifiedAt(LocalDateTime.now().toString());

        when(studentProfileRepository.findByStudentNumber("S12345")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.checkIn(request, "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("outside"));
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
        session.setStartsAt(LocalDateTime.now().minusMinutes(30));
        session.setEndsAt(LocalDateTime.now().plusMinutes(30));

        Campus campus = new Campus();
        campus.setName(campusName);
        session.setCampus(campus);
        return session;
    }
}
