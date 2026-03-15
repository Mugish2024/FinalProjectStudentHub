package aucasa.com.rw.controller;

import aucasa.com.rw.dto.department.DepartmentListResponse;
import aucasa.com.rw.repository.DepartmentRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public List<DepartmentListResponse> getAll() {
        return departmentRepository.findAll().stream()
                .map(dept -> new DepartmentListResponse(dept.getId(), dept.getName()))
                .toList();
    }
}
