package aucasa.com.rw.service;

import aucasa.com.rw.domain.SupportTicket;
import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.domain.enums.SupportTicketStatus;
import aucasa.com.rw.repository.StudentProfileRepository;
import aucasa.com.rw.repository.SupportTicketRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {
    private final SupportTicketRepository supportTicketRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final ChatService chatService;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                StudentProfileRepository studentProfileRepository,
                                UserAccountRepository userAccountRepository,
                                ChatService chatService) {
        this.supportTicketRepository = supportTicketRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userAccountRepository = userAccountRepository;
        this.chatService = chatService;
    }

    @Transactional
    public SupportTicket createTicket(String studentNumber, String subject, String message) {
        if (studentNumber == null || studentNumber.isBlank()) {
            throw new IllegalArgumentException("studentNumber is required.");
        }
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("subject is required.");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message is required.");
        }

        StudentProfile student = studentProfileRepository.findByStudentNumber(studentNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        UserAccount guild = userAccountRepository.findByRoleName(RoleType.GUILD_PRESIDENT)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Guild president account not found."));

        SupportTicket ticket = new SupportTicket();
        ticket.setStudent(student);
        ticket.setAssignedTo(guild);
        ticket.setSubject(subject.trim());
        ticket.setMessage(message.trim());
        ticket.setStatus(SupportTicketStatus.OPEN);
        return supportTicketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> listStudentTickets(String studentNumber) {
        return supportTicketRepository.findByStudentStudentNumberOrderByCreatedAtDesc(studentNumber);
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> listAssignedTickets(Long assignedToId) {
        return supportTicketRepository.findByAssignedToIdOrderByCreatedAtDesc(assignedToId);
    }

    @Transactional
    public SupportTicket respond(Long ticketId, Long responderId, String response, boolean respondToAll) {
        if (response == null || response.isBlank()) {
            throw new IllegalArgumentException("response message is required.");
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found."));
        UserAccount responder = userAccountRepository.findById(responderId)
                .orElseThrow(() -> new IllegalArgumentException("Responder not found."));

        ticket.setResponseText(response.trim());
        ticket.setResponseToAll(respondToAll);
        ticket.setStatus(SupportTicketStatus.RESPONDED);
        ticket.setRespondedAt(LocalDateTime.now());

        if (respondToAll) {
            chatService.sendMessage(responder.getId(), null, response, true);
        } else {
            UserAccount studentUser = ticket.getStudent().getUserAccount();
            chatService.sendMessage(responder.getId(), studentUser.getId(), response, false);
        }

        return supportTicketRepository.save(ticket);
    }

    @Transactional
    public SupportTicket forward(Long ticketId, Long forwardToUserId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found."));
        UserAccount target = userAccountRepository.findById(forwardToUserId)
                .orElseThrow(() -> new IllegalArgumentException("Forward target not found."));

        ticket.setAssignedTo(target);
        ticket.setStatus(SupportTicketStatus.FORWARDED);
        ticket.setForwardedAt(LocalDateTime.now());
        return supportTicketRepository.save(ticket);
    }
}
