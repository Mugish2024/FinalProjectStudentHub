package aucasa.com.rw.service;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.LabourCreditDeclaration;
import aucasa.com.rw.domain.LabourTimetableSlot;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.dto.labour.LabourCreditDeclarationResponse;
import aucasa.com.rw.dto.labour.LabourTimetableSlotRequest;
import aucasa.com.rw.dto.labour.LabourTimetableSlotResponse;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.LabourCreditDeclarationRepository;
import aucasa.com.rw.repository.StudentProfileRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LabourCreditDeclarationService {

    private final LabourCreditDeclarationRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final AcademicTermRepository academicTermRepository;
    private final ObjectMapper objectMapper;
    private final Path uploadDir;

    public LabourCreditDeclarationService(
            LabourCreditDeclarationRepository repository,
            StudentProfileRepository studentProfileRepository,
            AcademicTermRepository academicTermRepository,
            ObjectMapper objectMapper,
            @Value("${app.storage.labour-upload-dir:}") String uploadDir
    ) {
        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.academicTermRepository = academicTermRepository;
        this.objectMapper = objectMapper;
        this.uploadDir = resolveUploadDir(uploadDir);
    }

    @Transactional(readOnly = true)
    public LabourCreditDeclarationResponse getDeclaration(String studentNumber) {
        if (isBlank(studentNumber)) {
            throw new IllegalArgumentException("studentNumber is required.");
        }

        StudentProfile student = studentProfileRepository
                .findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        AcademicTerm term = academicTermRepository.findByActiveTrue()
                .orElseThrow(() -> new IllegalArgumentException("Active academic term not found."));

        return repository.findByStudentIdAndTermId(student.getId(), term.getId())
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public LabourCreditDeclarationResponse submitDeclaration(
            String studentNumber,
            Integer totalCredits,
            String timetableJson,
            MultipartFile timetableProofFile
    ) {
        if (isBlank(studentNumber) || totalCredits == null) {
            throw new IllegalArgumentException("studentNumber and totalCredits are required.");
        }
        if (totalCredits < 1 || totalCredits > 30) {
            throw new IllegalArgumentException("totalCredits must be between 1 and 30.");
        }

        StudentProfile student = studentProfileRepository
                .findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        AcademicTerm term = academicTermRepository.findByActiveTrue()
                .orElseThrow(() -> new IllegalArgumentException("Active academic term not found."));

        LabourCreditDeclaration declaration = repository.findByStudentIdAndTermId(student.getId(), term.getId())
                .orElse(null);

        if (declaration == null && (timetableProofFile == null || timetableProofFile.isEmpty())) {
            throw new IllegalArgumentException(
                    "Please upload a photo or file of your official class timetable as proof."
            );
        }

        List<LabourTimetableSlotRequest> timetableRequests = parseTimetableJson(timetableJson);
        List<LabourTimetableSlot> parsedSlots = parseSlots(timetableRequests);

        if (declaration == null) {
            declaration = new LabourCreditDeclaration();
            declaration.setStudent(student);
            declaration.setTerm(term);
        } else {
            declaration.getTimetable().clear();
        }
        declaration.setTotalCredits(totalCredits);
        declaration.setSubmittedAt(LocalDateTime.now());

        if (timetableProofFile != null && !timetableProofFile.isEmpty()) {
            declaration.setTimetableProofPath(storeFile(timetableProofFile));
        }

        for (LabourTimetableSlot slot : parsedSlots) {
            slot.setDeclaration(declaration);
            declaration.getTimetable().add(slot);
        }

        declaration = repository.save(declaration);
        return toResponse(declaration);
    }

    private List<LabourTimetableSlotRequest> parseTimetableJson(String timetableJson) {
        if (isBlank(timetableJson)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(timetableJson, new TypeReference<List<LabourTimetableSlotRequest>>() {
            });
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid timetable data.");
        }
    }

    private String storeFile(MultipartFile file) {
        try {
            Files.createDirectories(uploadDir);

            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "timetable";
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = "timetable-proof-" + System.currentTimeMillis() + "-" + safeName;

            Path destination = uploadDir.resolve(filename).normalize();
            if (!destination.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid file path.");
            }
            Files.copy(file.getInputStream(), destination);
            return "/uploads/labour/" + filename;
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store timetable proof file. Check server write permissions.");
        }
    }

    private Path resolveUploadDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home");
        return Paths.get(home, "FinalProjectStudentHubUploads", "labour").toAbsolutePath().normalize();
    }

    private List<LabourTimetableSlot> parseSlots(List<LabourTimetableSlotRequest> requests) {
        List<LabourTimetableSlot> slots = new ArrayList<>();
        if (requests == null) {
            return slots;
        }
        for (LabourTimetableSlotRequest req : requests) {
            if (req == null || isBlank(req.getDayOfWeek()) || isBlank(req.getStartTime()) || isBlank(req.getEndTime())) {
                throw new IllegalArgumentException("Each timetable slot requires dayOfWeek, startTime, and endTime.");
            }
            DayOfWeek dayOfWeek = parseDayOfWeek(req.getDayOfWeek());
            LocalTime start = parseTime(req.getStartTime());
            LocalTime end = parseTime(req.getEndTime());
            if (!end.isAfter(start)) {
                throw new IllegalArgumentException("Timetable slot endTime must be after startTime.");
            }

            LabourTimetableSlot slot = new LabourTimetableSlot();
            slot.setDayOfWeek(dayOfWeek);
            slot.setStartTime(start);
            slot.setEndTime(end);
            slot.setCourseLabel(isBlank(req.getCourseLabel()) ? null : req.getCourseLabel().trim());
            slots.add(slot);
        }

        for (int i = 0; i < slots.size(); i++) {
            for (int j = i + 1; j < slots.size(); j++) {
                LabourTimetableSlot a = slots.get(i);
                LabourTimetableSlot b = slots.get(j);
                if (a.getDayOfWeek() == b.getDayOfWeek()
                        && a.getStartTime().isBefore(b.getEndTime())
                        && b.getStartTime().isBefore(a.getEndTime())) {
                    throw new IllegalArgumentException("Timetable slots cannot overlap each other.");
                }
            }
        }

        return slots;
    }

    private DayOfWeek parseDayOfWeek(String value) {
        try {
            return DayOfWeek.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid dayOfWeek value: " + value);
        }
    }

    private LocalTime parseTime(String value) {
        try {
            return LocalTime.parse(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid time format. Use HH:mm.");
        }
    }

    private LabourCreditDeclarationResponse toResponse(LabourCreditDeclaration declaration) {
        List<LabourTimetableSlotResponse> slots = declaration.getTimetable().stream()
                .map(slot -> new LabourTimetableSlotResponse(
                        slot.getDayOfWeek().name(),
                        slot.getStartTime().toString(),
                        slot.getEndTime().toString(),
                        slot.getCourseLabel()
                ))
                .toList();

        return new LabourCreditDeclarationResponse(
                declaration.getId(),
                declaration.getStudent() != null ? declaration.getStudent().getStudentNumber() : null,
                declaration.getTerm() != null ? declaration.getTerm().getName() : null,
                declaration.getTotalCredits(),
                slots,
                declaration.getSubmittedAt(),
                declaration.getTimetableProofPath()
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
