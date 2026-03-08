package aucasa.com.rw.service;

import aucasa.com.rw.domain.Course;
import aucasa.com.rw.repository.CourseRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class CourseService {
    private final CourseRepository repository;

    public CourseService(CourseRepository repository) {
        this.repository = repository;
    }

    public List<Course> findAll() { return repository.findAll(); }
    public Optional<Course> findById(Long id) { return repository.findById(id); }
    public Course create(Course entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
