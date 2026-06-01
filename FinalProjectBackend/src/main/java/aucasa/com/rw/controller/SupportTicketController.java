package aucasa.com.rw.controller;

import aucasa.com.rw.domain.SupportTicket;
import aucasa.com.rw.dto.ticket.CreateTicketRequest;
import aucasa.com.rw.dto.ticket.SupportTicketResponse;
import aucasa.com.rw.dto.ticket.TicketActionRequest;
import aucasa.com.rw.service.SupportTicketService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class SupportTicketController {
    private final SupportTicketService supportTicketService;

    public SupportTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateTicketRequest request) {
        try {
            SupportTicket ticket = supportTicketService.createTicket(
                    request.getStudentNumber(),
                    request.getSubject(),
                    request.getMessage()
            );
            return ResponseEntity.ok(toResponse(ticket));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/student/{studentNumber}")
    public List<SupportTicketResponse> listStudent(@PathVariable String studentNumber) {
        return supportTicketService.listStudentTickets(studentNumber).stream().map(this::toResponse).toList();
    }

    @GetMapping("/assigned/{userId}")
    public List<SupportTicketResponse> listAssigned(@PathVariable Long userId) {
        return supportTicketService.listAssignedTickets(userId).stream().map(this::toResponse).toList();
    }

    @PostMapping("/{ticketId}/respond")
    public ResponseEntity<?> respond(@PathVariable Long ticketId, @RequestBody TicketActionRequest request) {
        try {
            SupportTicket ticket = supportTicketService.respond(
                    ticketId,
                    request.getUserId(),
                    request.getMessage(),
                    request.isRespondToAll()
            );
            return ResponseEntity.ok(toResponse(ticket));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{ticketId}/forward")
    public ResponseEntity<?> forward(@PathVariable Long ticketId, @RequestBody TicketActionRequest request) {
        try {
            SupportTicket ticket = supportTicketService.forward(
                    ticketId,
                    request.getForwardToUserId()
            );
            return ResponseEntity.ok(toResponse(ticket));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{ticketId}/close")
    public ResponseEntity<?> close(@PathVariable Long ticketId) {
        try {
            SupportTicket ticket = supportTicketService.close(ticketId);
            return ResponseEntity.ok(toResponse(ticket));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        SupportTicketResponse response = new SupportTicketResponse();
        response.setId(ticket.getId());
        response.setStudentNumber(ticket.getStudent() != null ? ticket.getStudent().getStudentNumber() : null);
        response.setSubject(ticket.getSubject());
        response.setMessage(ticket.getMessage());
        response.setStatus(ticket.getStatus() != null ? ticket.getStatus().name() : null);
        response.setAssignedToName(ticket.getAssignedTo() != null
                ? ticket.getAssignedTo().getFirstName() + " " + ticket.getAssignedTo().getLastName()
                : null);
        response.setResponseText(ticket.getResponseText());
        response.setResponseToAll(ticket.isResponseToAll());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setRespondedAt(ticket.getRespondedAt());
        return response;
    }
}

