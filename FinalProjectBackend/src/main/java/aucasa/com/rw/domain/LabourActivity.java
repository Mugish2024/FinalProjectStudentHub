package aucasa.com.rw.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "labour_activities")
public class LabourActivity extends BaseEntity {

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 140)
    private String department;

    @Column(length = 1200)
    private String description;

    @Column(nullable = false)
    private Integer minSemester = 1;

    @Column(nullable = false)
    private Double minGpa = 0.0;

    @Column(nullable = false)
    private Boolean requiresSatisfactoryDiscipline = true;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getMinSemester() {
        return minSemester;
    }

    public void setMinSemester(Integer minSemester) {
        this.minSemester = minSemester;
    }

    public Double getMinGpa() {
        return minGpa;
    }

    public void setMinGpa(Double minGpa) {
        this.minGpa = minGpa;
    }

    public Boolean getRequiresSatisfactoryDiscipline() {
        return requiresSatisfactoryDiscipline;
    }

    public void setRequiresSatisfactoryDiscipline(Boolean requiresSatisfactoryDiscipline) {
        this.requiresSatisfactoryDiscipline = requiresSatisfactoryDiscipline;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

