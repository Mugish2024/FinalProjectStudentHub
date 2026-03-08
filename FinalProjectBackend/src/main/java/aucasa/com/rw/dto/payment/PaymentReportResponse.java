package aucasa.com.rw.dto.payment;

import java.util.List;

public class PaymentReportResponse {
    private Long termId;
    private long totalBilled;
    private long totalPaid;
    private long totalUnpaid;
    private double paidPercentage;
    private List<UnpaidStudentItem> unpaidStudents;

    public PaymentReportResponse(Long termId, long totalBilled, long totalPaid, long totalUnpaid, double paidPercentage,
                                 List<UnpaidStudentItem> unpaidStudents) {
        this.termId = termId;
        this.totalBilled = totalBilled;
        this.totalPaid = totalPaid;
        this.totalUnpaid = totalUnpaid;
        this.paidPercentage = paidPercentage;
        this.unpaidStudents = unpaidStudents;
    }

    public Long getTermId() {
        return termId;
    }

    public long getTotalBilled() {
        return totalBilled;
    }

    public long getTotalPaid() {
        return totalPaid;
    }

    public long getTotalUnpaid() {
        return totalUnpaid;
    }

    public double getPaidPercentage() {
        return paidPercentage;
    }

    public List<UnpaidStudentItem> getUnpaidStudents() {
        return unpaidStudents;
    }
}
