package aucasa.com.rw.service;

import aucasa.com.rw.domain.LabourDailyLog;
import aucasa.com.rw.repository.LabourDailyLogRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class LabourDailyLogService {
    private final LabourDailyLogRepository repository;

    public LabourDailyLogService(LabourDailyLogRepository repository) {
        this.repository = repository;
    }

    public List<LabourDailyLog> findAll() { return repository.findAll(); }
    public Optional<LabourDailyLog> findById(Long id) { return repository.findById(id); }
    public LabourDailyLog create(LabourDailyLog entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
