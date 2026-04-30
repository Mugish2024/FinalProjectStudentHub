package aucasa.com.rw.domain;

import aucasa.com.rw.domain.enums.SupportTicketStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
public class SupportTicket extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id")
    private UserAccount assignedTo;

    @Column(nullable = false, length = 180)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(length = 2000)
    private String responseText;

    @Column(nullable = false)
    private boolean responseToAll = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupportTicketStatus status = SupportTicketStatus.OPEN;

    @Column
    private LocalDateTime respondedAt;

    @Column
    private LocalDateTime forwardedAt;

    public StudentProfile getStudent() {
        return student;
    }

    public void setStudent(StudentProfile student) {
        this.student = student;
    }

    public UserAccount getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(UserAccount assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public boolean isResponseToAll() {
        return responseToAll;
    }

    public void setResponseToAll(boolean responseToAll) {
        this.responseToAll = responseToAll;
    }

    public SupportTicketStatus getStatus() {
        return status;
    }

    public void setStatus(SupportTicketStatus status) {
        this.status = status;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }

    public LocalDateTime getForwardedAt() {
        return forwardedAt;
    }

    public void setForwardedAt(LocalDateTime forwardedAt) {
        this.forwardedAt = forwardedAt;
    }
}
