package aucasa.com.rw.service;

import aucasa.com.rw.domain.LabourActivity;
import aucasa.com.rw.dto.labour.LabourActivityRequest;
import aucasa.com.rw.dto.labour.LabourActivityResponse;
import aucasa.com.rw.repository.LabourActivityRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LabourActivityService {
    private final LabourActivityRepository repository;

    public LabourActivityService(LabourActivityRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<LabourActivityResponse> list(Boolean activeOnly) {
        List<LabourActivity> items = Boolean.TRUE.equals(activeOnly)
                ? repository.findByActiveTrueOrderByCreatedAtDesc()
                : repository.findAll().stream().sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())).toList();
        return items.stream().map(this::toResponse).toList();
    }

    @Transactional
    public LabourActivityResponse create(LabourActivityRequest request) {
        if (request == null || isBlank(request.getTitle()) || isBlank(request.getDepartment())) {
            throw new IllegalArgumentException("title and department are required.");
        }
        LabourActivity item = new LabourActivity();
        item.setTitle(request.getTitle().trim());
        item.setDepartment(request.getDepartment().trim());
        item.setDescription(safeTrim(request.getDescription()));
        item.setMinSemester(request.getMinSemester() == null ? 1 : Math.max(1, request.getMinSemester()));
        item.setMinGpa(request.getMinGpa() == null ? 0.0 : Math.max(0.0, request.getMinGpa()));
        item.setRequiresSatisfactoryDiscipline(request.getRequiresSatisfactoryDiscipline() == null ? true : request.getRequiresSatisfactoryDiscipline());
        item.setActive(request.getActive() == null ? true : request.getActive());
        item.setCreatedAt(LocalDateTime.now());
        item = repository.save(item);
        return toResponse(item);
    }

    private LabourActivityResponse toResponse(LabourActivity item) {
        return new LabourActivityResponse(
                item.getId(),
                item.getTitle(),
                item.getDepartment(),
                item.getDescription(),
                item.getMinSemester(),
                item.getMinGpa(),
                item.getRequiresSatisfactoryDiscipline(),
                item.getActive(),
                item.getCreatedAt()
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String safeTrim(String value) {
        return isBlank(value) ? null : value.trim();
    }
}

