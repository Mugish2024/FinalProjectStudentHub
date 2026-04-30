package aucasa.com.rw.repository;

import aucasa.com.rw.domain.SupportTicket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByStudentStudentNumberOrderByCreatedAtDesc(String studentNumber);
    List<SupportTicket> findByAssignedToIdOrderByCreatedAtDesc(Long assignedToId);
}
