package aucasa.com.rw.service;

import aucasa.com.rw.domain.Event;
import aucasa.com.rw.repository.EventRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class EventService {
    private final EventRepository repository;

    public EventService(EventRepository repository) {
        this.repository = repository;
    }

    public List<Event> findAll() { return repository.findAll(); }
    public Optional<Event> findById(Long id) { return repository.findById(id); }
    public Event create(Event entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
