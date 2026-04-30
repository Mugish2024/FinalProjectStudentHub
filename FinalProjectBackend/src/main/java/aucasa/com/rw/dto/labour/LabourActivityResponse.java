package aucasa.com.rw.dto.labour;

import java.time.LocalDateTime;

public class LabourActivityResponse {
    private Long id;
    private String title;
    private String department;
    private String description;
    private Integer minSemester;
    private Double minGpa;
    private Boolean requiresSatisfactoryDiscipline;
    private Boolean active;
    private LocalDateTime createdAt;

    public LabourActivityResponse(
            Long id,
            String title,
            String department,
            String description,
            Integer minSemester,
            Double minGpa,
            Boolean requiresSatisfactoryDiscipline,
            Boolean active,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.description = description;
        this.minSemester = minSemester;
        this.minGpa = minGpa;
        this.requiresSatisfactoryDiscipline = requiresSatisfactoryDiscipline;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDepartment() { return department; }
    public String getDescription() { return description; }
    public Integer getMinSemester() { return minSemester; }
    public Double getMinGpa() { return minGpa; }
    public Boolean getRequiresSatisfactoryDiscipline() { return requiresSatisfactoryDiscipline; }
    public Boolean getActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

