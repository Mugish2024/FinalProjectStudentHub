package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Event;
import aucasa.com.rw.domain.enums.EventStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(EventStatus status);
    List<Event> findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate fromDate);
}
