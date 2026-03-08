package aucasa.com.rw.service;

import aucasa.com.rw.domain.DisciplineRecord;
import aucasa.com.rw.repository.DisciplineRecordRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class DisciplineRecordService {
    private final DisciplineRecordRepository repository;

    public DisciplineRecordService(DisciplineRecordRepository repository) {
        this.repository = repository;
    }

    public List<DisciplineRecord> findAll() { return repository.findAll(); }
    public Optional<DisciplineRecord> findById(Long id) { return repository.findById(id); }
    public DisciplineRecord create(DisciplineRecord entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
