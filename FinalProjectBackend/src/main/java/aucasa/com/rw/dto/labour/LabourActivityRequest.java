package aucasa.com.rw.dto.labour;

public class LabourActivityRequest {
    private String title;
    private String department;
    private String description;
    private Integer minSemester;
    private Double minGpa;
    private Boolean requiresSatisfactoryDiscipline;
    private Boolean active;

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
}

