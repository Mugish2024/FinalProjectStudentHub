package aucasa.com.rw.service;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.dto.semester.SemesterManagementResponse;
import aucasa.com.rw.dto.semester.SemesterRequest;
import aucasa.com.rw.dto.semester.SemesterRolloverResponse;
import aucasa.com.rw.dto.semester.SemesterSummaryResponse;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.AttendanceRecordRepository;
import aucasa.com.rw.repository.AttendanceSessionRepository;
import aucasa.com.rw.repository.ClaimRepository;
import aucasa.com.rw.repository.CourseGroupRepository;
import aucasa.com.rw.repository.DisciplineEntryRepository;
import aucasa.com.rw.repository.DisciplineRecordRepository;
import aucasa.com.rw.repository.ElectionCandidateRepository;
import aucasa.com.rw.repository.ElectionRepository;
import aucasa.com.rw.repository.EventRepository;
import aucasa.com.rw.repository.FinanceBudgetRepository;
import aucasa.com.rw.repository.FinanceCommunicationUpdateRepository;
import aucasa.com.rw.repository.FinanceExpenseRepository;
import aucasa.com.rw.repository.FinanceFundRequestRepository;
import aucasa.com.rw.repository.LabourApplicationRepository;
import aucasa.com.rw.repository.LabourBackfillApprovalRepository;
import aucasa.com.rw.repository.LabourDailyLogRepository;
import aucasa.com.rw.repository.PaymentRepository;
import aucasa.com.rw.repository.PaymentTransactionRepository;
import aucasa.com.rw.repository.RegistrationRecordRepository;
import aucasa.com.rw.repository.SupportTicketRepository;
import aucasa.com.rw.repository.VoteRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SemesterManagementService {
    private final AcademicTermRepository academicTermRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentRepository paymentRepository;
    private final FinanceExpenseRepository financeExpenseRepository;
    private final FinanceFundRequestRepository financeFundRequestRepository;
    private final FinanceBudgetRepository financeBudgetRepository;
    private final FinanceCommunicationUpdateRepository financeCommunicationUpdateRepository;
    private final LabourDailyLogRepository labourDailyLogRepository;
    private final LabourApplicationRepository labourApplicationRepository;
    private final LabourBackfillApprovalRepository labourBackfillApprovalRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final VoteRepository voteRepository;
    private final ElectionCandidateRepository electionCandidateRepository;
    private final ElectionRepository electionRepository;
    private final DisciplineEntryRepository disciplineEntryRepository;
    private final DisciplineRecordRepository disciplineRecordRepository;
    private final ClaimRepository claimRepository;
    private final RegistrationRecordRepository registrationRecordRepository;
    private final CourseGroupRepository courseGroupRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final EventRepository eventRepository;

    public SemesterManagementService(
            AcademicTermRepository academicTermRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            PaymentRepository paymentRepository,
            FinanceExpenseRepository financeExpenseRepository,
            FinanceFundRequestRepository financeFundRequestRepository,
            FinanceBudgetRepository financeBudgetRepository,
            FinanceCommunicationUpdateRepository financeCommunicationUpdateRepository,
            LabourDailyLogRepository labourDailyLogRepository,
            LabourApplicationRepository labourApplicationRepository,
            LabourBackfillApprovalRepository labourBackfillApprovalRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            VoteRepository voteRepository,
            ElectionCandidateRepository electionCandidateRepository,
            ElectionRepository electionRepository,
            DisciplineEntryRepository disciplineEntryRepository,
            DisciplineRecordRepository disciplineRecordRepository,
            ClaimRepository claimRepository,
            RegistrationRecordRepository registrationRecordRepository,
            CourseGroupRepository courseGroupRepository,
            SupportTicketRepository supportTicketRepository,
            EventRepository eventRepository
    ) {
        this.academicTermRepository = academicTermRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentRepository = paymentRepository;
        this.financeExpenseRepository = financeExpenseRepository;
        this.financeFundRequestRepository = financeFundRequestRepository;
        this.financeBudgetRepository = financeBudgetRepository;
        this.financeCommunicationUpdateRepository = financeCommunicationUpdateRepository;
        this.labourDailyLogRepository = labourDailyLogRepository;
        this.labourApplicationRepository = labourApplicationRepository;
        this.labourBackfillApprovalRepository = labourBackfillApprovalRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.voteRepository = voteRepository;
        this.electionCandidateRepository = electionCandidateRepository;
        this.electionRepository = electionRepository;
        this.disciplineEntryRepository = disciplineEntryRepository;
        this.disciplineRecordRepository = disciplineRecordRepository;
        this.claimRepository = claimRepository;
        this.registrationRecordRepository = registrationRecordRepository;
        this.courseGroupRepository = courseGroupRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional(readOnly = true)
    public SemesterManagementResponse getManagementSnapshot() {
        SemesterManagementResponse response = new SemesterManagementResponse();
        response.setActiveSemester(academicTermRepository.findByActiveTrue().map(this::toSummary).orElse(null));
        response.setSemesters(listSemesters());
        response.setResettableCounts(getResettableCounts());
        return response;
    }

    @Transactional(readOnly = true)
    public List<SemesterSummaryResponse> listSemesters() {
        return academicTermRepository.findAll().stream()
                .sorted(Comparator.comparing(AcademicTerm::getStartDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(AcademicTerm::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public SemesterRolloverResponse createNewSemester(SemesterRequest request) {
        validateRequest(request);
        Map<String, Long> resetCounts = getResettableCounts();

        deleteResettableRecords();

        List<AcademicTerm> terms = academicTermRepository.findAll();
        for (AcademicTerm term : terms) {
            term.setActive(false);
        }
        academicTermRepository.saveAll(terms);

        AcademicTerm newTerm = new AcademicTerm();
        newTerm.setName(request.getName().trim());
        newTerm.setAcademicYear(request.getAcademicYear().trim());
        newTerm.setSemesterNumber(request.getSemesterNumber());
        newTerm.setStartDate(request.getStartDate());
        newTerm.setEndDate(request.getEndDate());
        newTerm.setActive(true);
        AcademicTerm saved = academicTermRepository.save(newTerm);

        SemesterRolloverResponse response = new SemesterRolloverResponse();
        response.setNewActiveSemester(toSummary(saved));
        response.setResetCounts(resetCounts);
        response.setMessage("New semester created. Semester activity has been reset to zero.");
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getResettableCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("paymentTransactions", paymentTransactionRepository.count());
        counts.put("payments", paymentRepository.count());
        counts.put("financeExpenses", financeExpenseRepository.count());
        counts.put("financeFundRequests", financeFundRequestRepository.count());
        counts.put("financeBudgets", financeBudgetRepository.count());
        counts.put("financeUpdates", financeCommunicationUpdateRepository.count());
        counts.put("labourDailyLogs", labourDailyLogRepository.count());
        counts.put("labourApplications", labourApplicationRepository.count());
        counts.put("labourBackfillApprovals", labourBackfillApprovalRepository.count());
        counts.put("attendanceRecords", attendanceRecordRepository.count());
        counts.put("attendanceSessions", attendanceSessionRepository.count());
        counts.put("votes", voteRepository.count());
        counts.put("electionCandidates", electionCandidateRepository.count());
        counts.put("elections", electionRepository.count());
        counts.put("disciplineEntries", disciplineEntryRepository.count());
        counts.put("disciplineRecords", disciplineRecordRepository.count());
        counts.put("claims", claimRepository.count());
        counts.put("registrationRecords", registrationRecordRepository.count());
        counts.put("courseGroups", courseGroupRepository.count());
        counts.put("supportTickets", supportTicketRepository.count());
        counts.put("events", eventRepository.count());
        return counts;
    }

    private void deleteResettableRecords() {
        paymentTransactionRepository.deleteAllInBatch();

        financeExpenseRepository.deleteAllInBatch();
        financeFundRequestRepository.deleteAllInBatch();
        financeBudgetRepository.deleteAllInBatch();
        financeCommunicationUpdateRepository.deleteAllInBatch();

        labourDailyLogRepository.deleteAllInBatch();
        labourApplicationRepository.deleteAllInBatch();
        labourBackfillApprovalRepository.deleteAllInBatch();

        attendanceRecordRepository.deleteAllInBatch();
        attendanceSessionRepository.deleteAllInBatch();

        voteRepository.deleteAllInBatch();
        electionCandidateRepository.deleteAllInBatch();
        electionRepository.deleteAllInBatch();

        disciplineEntryRepository.deleteAllInBatch();
        disciplineRecordRepository.deleteAllInBatch();
        claimRepository.deleteAllInBatch();
        registrationRecordRepository.deleteAllInBatch();
        courseGroupRepository.deleteAllInBatch();
        supportTicketRepository.deleteAllInBatch();
        eventRepository.deleteAllInBatch();
    }

    private void validateRequest(SemesterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Semester details are required.");
        }
        if (isBlank(request.getName())) {
            throw new IllegalArgumentException("Semester name is required.");
        }
        if (isBlank(request.getAcademicYear())) {
            throw new IllegalArgumentException("Academic year is required.");
        }
        if (request.getSemesterNumber() == null || request.getSemesterNumber() < 1) {
            throw new IllegalArgumentException("Semester number must be at least 1.");
        }
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private SemesterSummaryResponse toSummary(AcademicTerm term) {
        SemesterSummaryResponse response = new SemesterSummaryResponse();
        response.setId(term.getId());
        response.setName(term.getName());
        response.setAcademicYear(term.getAcademicYear());
        response.setSemesterNumber(term.getSemesterNumber());
        response.setStartDate(term.getStartDate());
        response.setEndDate(term.getEndDate());
        response.setActive(term.getActive());
        response.setCreatedAt(term.getCreatedAt());
        return response;
    }
}
