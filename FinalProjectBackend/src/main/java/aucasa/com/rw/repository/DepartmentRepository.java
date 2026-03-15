package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Department;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByFacultyId(Long facultyId);
    Optional<Department> findByFacultyIdAndNameIgnoreCase(Long facultyId, String name);
    Optional<Department> findByNameIgnoreCase(String name);
}
