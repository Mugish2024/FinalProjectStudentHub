package aucasa.com.rw.service;

import aucasa.com.rw.domain.AttendanceRecord;
import aucasa.com.rw.repository.AttendanceRecordRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class AttendanceRecordService {
    private final AttendanceRecordRepository repository;

    public AttendanceRecordService(AttendanceRecordRepository repository) {
        this.repository = repository;
    }

    public List<AttendanceRecord> findAll() { return repository.findAll(); }
    public Optional<AttendanceRecord> findById(Long id) { return repository.findById(id); }
    public AttendanceRecord create(AttendanceRecord entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
