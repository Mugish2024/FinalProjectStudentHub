package aucasa.com.rw.repository;

import aucasa.com.rw.domain.CourseGroup;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseGroupRepository extends JpaRepository<CourseGroup, Long> {
    List<CourseGroup> findByCourseIdAndTermId(Long courseId, Long termId);
}
