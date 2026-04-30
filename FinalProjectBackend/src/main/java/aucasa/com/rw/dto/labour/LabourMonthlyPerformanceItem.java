package aucasa.com.rw.dto.labour;

public class LabourMonthlyPerformanceItem {
    private String studentNumber;
    private String studentName;
    private String campus;
    private String position;
    private int expectedWorkDays;
    private int daysPresent;
    private int daysMissed;
    private String totalHours;

    public LabourMonthlyPerformanceItem(
            String studentNumber,
            String studentName,
            String campus,
            String position,
            int expectedWorkDays,
            int daysPresent,
            int daysMissed,
            String totalHours
    ) {
        this.studentNumber = studentNumber;
        this.studentName = studentName;
        this.campus = campus;
        this.position = position;
        this.expectedWorkDays = expectedWorkDays;
        this.daysPresent = daysPresent;
        this.daysMissed = daysMissed;
        this.totalHours = totalHours;
    }

    public String getStudentNumber() { return studentNumber; }
    public String getStudentName() { return studentName; }
    public String getCampus() { return campus; }
    public String getPosition() { return position; }
    public int getExpectedWorkDays() { return expectedWorkDays; }
    public int getDaysPresent() { return daysPresent; }
    public int getDaysMissed() { return daysMissed; }
    public String getTotalHours() { return totalHours; }
}
