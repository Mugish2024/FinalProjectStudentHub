package aucasa.com.rw.dto.labour;

public class LabourTimetableSlotResponse {
    private final String dayOfWeek;
    private final String startTime;
    private final String endTime;
    private final String courseLabel;

    public LabourTimetableSlotResponse(String dayOfWeek, String startTime, String endTime, String courseLabel) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.courseLabel = courseLabel;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public String getStartTime() {
        return startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public String getCourseLabel() {
        return courseLabel;
    }
}
