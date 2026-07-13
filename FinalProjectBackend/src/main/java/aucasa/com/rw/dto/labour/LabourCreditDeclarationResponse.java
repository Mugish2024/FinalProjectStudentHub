package aucasa.com.rw.dto.labour;

import java.time.LocalDateTime;
import java.util.List;

public class LabourCreditDeclarationResponse {
    private final Long id;
    private final String studentNumber;
    private final String termName;
    private final Integer totalCredits;
    private final List<LabourTimetableSlotResponse> timetable;
    private final LocalDateTime submittedAt;
    private final String timetableProofPath;

    public LabourCreditDeclarationResponse(
            Long id,
            String studentNumber,
            String termName,
            Integer totalCredits,
            List<LabourTimetableSlotResponse> timetable,
            LocalDateTime submittedAt,
            String timetableProofPath
    ) {
        this.id = id;
        this.studentNumber = studentNumber;
        this.termName = termName;
        this.totalCredits = totalCredits;
        this.timetable = timetable;
        this.submittedAt = submittedAt;
        this.timetableProofPath = timetableProofPath;
    }

    public Long getId() {
        return id;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getTermName() {
        return termName;
    }

    public Integer getTotalCredits() {
        return totalCredits;
    }

    public List<LabourTimetableSlotResponse> getTimetable() {
        return timetable;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public String getTimetableProofPath() {
        return timetableProofPath;
    }
}
