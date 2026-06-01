package aucasa.com.rw.controller;

import aucasa.com.rw.domain.StudentProfile;
import aucasa.com.rw.dto.student.StudentRegistrationRequest;
import aucasa.com.rw.dto.student.StudentRegistrationResponse;
import aucasa.com.rw.service.ImsStudentGatewayService;
import aucasa.com.rw.service.ImsPaymentGatewayService;
import aucasa.com.rw.service.StudentProfileService;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class StudentProfileController {
    private final StudentProfileService service;
    private final ImsStudentGatewayService imsStudentGatewayService;
    private final ImsPaymentGatewayService imsPaymentGatewayService;

    public StudentProfileController(
            StudentProfileService service,
            ImsStudentGatewayService imsStudentGatewayService,
            ImsPaymentGatewayService imsPaymentGatewayService
    ) {
        this.service = service;
        this.imsStudentGatewayService = imsStudentGatewayService;
        this.imsPaymentGatewayService = imsPaymentGatewayService;
    }

    @GetMapping
    public List<StudentRegistrationResponse> getAll() { return service.findAllSummaries(); }

    @GetMapping("/{id}")
    public ResponseEntity<StudentProfile> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/summary")
    public List<StudentRegistrationResponse> getAllSummaries() {
        return service.findAllSummaries();
    }

    @GetMapping("/ims/all")
    public ResponseEntity<?> getAllStudentsFromIms() {
        try {
            List<Map<String, Object>> raw = imsStudentGatewayService.fetchAllStudentsRaw();
            List<Map<String, Object>> mapped = new ArrayList<>();
            for (Map<String, Object> row : raw) {
                String studentId = firstNonBlank(
                        asString(row.get("studentId")),
                        asString(row.get("id")),
                        asString(row.get("studentCode"))
                );
                String studentNumber = firstNonBlank(
                        asString(row.get("studentCode")),
                        asString(row.get("studentNumber")),
                        studentId
                );
                String fullName = firstNonBlank(
                        asString(row.get("studentName")),
                        asString(row.get("name")),
                        (asString(row.get("firstName")) + " " + asString(row.get("lastName"))).trim()
                );
                String faculty = firstNonBlank(
                        asString(row.get("faculty")),
                        asString(row.get("facultyName")),
                        "N/A"
                );
                String department = firstNonBlank(
                        asString(row.get("department")),
                        asString(row.get("departmentName")),
                        asString(row.get("departmentCode")),
                        "N/A"
                );
                String program = firstNonBlank(asString(row.get("program")), "N/A");
                int credits = asInt(row.get("credits"));

                mapped.add(Map.of(
                        "studentId", studentId,
                        "studentNumber", studentNumber,
                        "fullName", fullName,
                        "faculty", faculty,
                        "department", department,
                        "program", program,
                        "credits", credits
                ));
            }
            return ResponseEntity.ok(Map.of("source", "IMS", "count", mapped.size(), "data", mapped));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/ims/count")
    public ResponseEntity<?> getImsMemberCount() {
        try {
            Set<String> uniqueStudents = new HashSet<>();

            // Primary source: finance records (if IMS key has finance permissions)
            try {
                Map<String, Object> payload = imsPaymentGatewayService.fetchAllStudentPayments();
                Object dataObj = payload.get("data");
                if (dataObj instanceof List<?> rows) {
                    for (Object rowObj : rows) {
                        if (!(rowObj instanceof Map<?, ?> row)) {
                            continue;
                        }
                        String studentId = firstNonBlank(
                                asString(row.get("studentId")),
                                asString(row.get("studentCode")),
                                asString(row.get("studentNumber"))
                        );
                        if (!studentId.isBlank()) {
                            uniqueStudents.add(studentId);
                        }
                    }
                }
            } catch (Exception ignored) {
                // Fallback below.
            }

            // Fallback source: IMS student roster (more widely permissioned)
            if (uniqueStudents.isEmpty()) {
                try {
                    List<Map<String, Object>> roster = imsStudentGatewayService.fetchAllStudentsRaw();
                    for (Map<String, Object> row : roster) {
                        String studentId = firstNonBlank(
                                asString(row.get("studentId")),
                                asString(row.get("id")),
                                asString(row.get("studentCode")),
                                asString(row.get("studentNumber"))
                        );
                        if (!studentId.isBlank()) {
                            uniqueStudents.add(studentId);
                        }
                    }
                } catch (Exception ignored) {
                    // Keep empty result to avoid breaking dashboards.
                }
            }

            int count = uniqueStudents.size();
            if (count == 0) {
                try {
                    count = service.findAllSummaries().size();
                } catch (Exception ignored) {
                    count = 0;
                }
            }

            return ResponseEntity.ok(Map.of("count", count));
        } catch (Throwable ignored) {
            try {
                return ResponseEntity.ok(Map.of("count", service.findAllSummaries().size()));
            } catch (Exception ex) {
                return ResponseEntity.ok(Map.of("count", 0));
            }
        }
    }

    @GetMapping("/summary/search")
    public ResponseEntity<?> findSummaryByStudentNumber(@RequestParam String studentNumber) {
        if (studentNumber == null || studentNumber.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "studentNumber is required"));
        }
        return service.findSummaryByStudentNumber(studentNumber.trim())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StudentProfile> create(@RequestBody StudentProfile payload) {
        return ResponseEntity.ok(service.create(payload));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody StudentRegistrationRequest request) {
        try {
            StudentRegistrationResponse response = service.registerStudent(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/register/demo")
    public ResponseEntity<?> registerDemoStudents() {
        try {
            return ResponseEntity.ok(service.createDemoStudents());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody StudentRegistrationRequest request) {
        try {
            StudentRegistrationResponse response = service.updateStudent(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private int asInt(Object value) {
        if (value == null) return 0;
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (Exception ex) {
            return 0;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }
        return "";
    }
}

