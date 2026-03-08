package aucasa.com.rw.service;

import aucasa.com.rw.domain.LabourApplication;
import aucasa.com.rw.repository.LabourApplicationRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class LabourApplicationService {
    private final LabourApplicationRepository repository;

    public LabourApplicationService(LabourApplicationRepository repository) {
        this.repository = repository;
    }

    public List<LabourApplication> findAll() { return repository.findAll(); }
    public Optional<LabourApplication> findById(Long id) { return repository.findById(id); }
    public LabourApplication create(LabourApplication entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
