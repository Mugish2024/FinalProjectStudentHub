package aucasa.com.rw.dto.labour;

import java.time.LocalDateTime;

public class LabourApplicationResponse {
    private Long id;
    private String studentNumber;
    private String studentName;
    private String department;
    private String status;
    private LocalDateTime submittedAt;
    private String coverLetterPath;
    private String transcriptPath;
    private String coverLetterText;
    private LocalDateTime reviewedAt;
    private String reviewNotes;

    public LabourApplicationResponse(
            Long id,
            String studentNumber,
            String studentName,
            String department,
            String status,
            LocalDateTime submittedAt,
            String coverLetterPath,
            String transcriptPath,
            String coverLetterText,
            LocalDateTime reviewedAt,
            String reviewNotes
    ) {
        this.id = id;
        this.studentNumber = studentNumber;
        this.studentName = studentName;
        this.department = department;
        this.status = status;
        this.submittedAt = submittedAt;
        this.coverLetterPath = coverLetterPath;
        this.transcriptPath = transcriptPath;
        this.coverLetterText = coverLetterText;
        this.reviewedAt = reviewedAt;
        this.reviewNotes = reviewNotes;
    }

    public Long getId() {
        return id;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getDepartment() {
        return department;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public String getCoverLetterPath() {
        return coverLetterPath;
    }

    public String getTranscriptPath() {
        return transcriptPath;
    }

    public String getCoverLetterText() {
        return coverLetterText;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }
}
