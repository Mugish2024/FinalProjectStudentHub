package aucasa.com.rw.service;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.repository.ElectionRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ElectionService {
    private final ElectionRepository repository;

    public ElectionService(ElectionRepository repository) {
        this.repository = repository;
    }

    public List<Election> findAll() { return repository.findAll(); }
    public Optional<Election> findById(Long id) { return repository.findById(id); }
    public Election create(Election entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
