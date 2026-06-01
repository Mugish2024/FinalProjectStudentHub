package aucasa.com.rw.dto.semester;

import java.util.Map;

public class SemesterRolloverResponse {
    private SemesterSummaryResponse newActiveSemester;
    private Map<String, Long> resetCounts;
    private String message;

    public SemesterSummaryResponse getNewActiveSemester() {
        return newActiveSemester;
    }

    public void setNewActiveSemester(SemesterSummaryResponse newActiveSemester) {
        this.newActiveSemester = newActiveSemester;
    }

    public Map<String, Long> getResetCounts() {
        return resetCounts;
    }

    public void setResetCounts(Map<String, Long> resetCounts) {
        this.resetCounts = resetCounts;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
