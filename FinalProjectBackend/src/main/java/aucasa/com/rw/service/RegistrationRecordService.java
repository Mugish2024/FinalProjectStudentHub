package aucasa.com.rw.service;

import aucasa.com.rw.domain.RegistrationRecord;
import aucasa.com.rw.repository.RegistrationRecordRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class RegistrationRecordService {
    private final RegistrationRecordRepository repository;

    public RegistrationRecordService(RegistrationRecordRepository repository) {
        this.repository = repository;
    }

    public List<RegistrationRecord> findAll() { return repository.findAll(); }
    public Optional<RegistrationRecord> findById(Long id) { return repository.findById(id); }
    public RegistrationRecord create(RegistrationRecord entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
