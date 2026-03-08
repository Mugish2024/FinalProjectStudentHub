package aucasa.com.rw.dto.payment;

public class CreateObligationRequest {
    private Long studentId;
    private Long termId;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getTermId() {
        return termId;
    }

    public void setTermId(Long termId) {
        this.termId = termId;
    }
}
