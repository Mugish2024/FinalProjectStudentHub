package aucasa.com.rw.dto.semester;

import java.util.List;
import java.util.Map;

public class SemesterManagementResponse {
    private SemesterSummaryResponse activeSemester;
    private List<SemesterSummaryResponse> semesters;
    private Map<String, Long> resettableCounts;

    public SemesterSummaryResponse getActiveSemester() {
        return activeSemester;
    }

    public void setActiveSemester(SemesterSummaryResponse activeSemester) {
        this.activeSemester = activeSemester;
    }

    public List<SemesterSummaryResponse> getSemesters() {
        return semesters;
    }

    public void setSemesters(List<SemesterSummaryResponse> semesters) {
        this.semesters = semesters;
    }

    public Map<String, Long> getResettableCounts() {
        return resettableCounts;
    }

    public void setResettableCounts(Map<String, Long> resettableCounts) {
        this.resettableCounts = resettableCounts;
    }
}
