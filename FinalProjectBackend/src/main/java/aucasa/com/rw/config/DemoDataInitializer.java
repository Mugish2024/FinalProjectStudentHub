package aucasa.com.rw.config;

import aucasa.com.rw.domain.AcademicTerm;
import aucasa.com.rw.domain.AttendanceSession;
import aucasa.com.rw.domain.Campus;
import aucasa.com.rw.domain.Election;
import aucasa.com.rw.domain.FinanceBudget;
import aucasa.com.rw.domain.Faculty;
import aucasa.com.rw.domain.Role;
import aucasa.com.rw.domain.UserAccount;
import aucasa.com.rw.domain.enums.AccountStatus;
import aucasa.com.rw.domain.enums.ElectionStatus;
import aucasa.com.rw.domain.enums.FinanceBudgetStatus;
import aucasa.com.rw.domain.enums.RoleType;
import aucasa.com.rw.repository.AcademicTermRepository;
import aucasa.com.rw.repository.AttendanceSessionRepository;
import aucasa.com.rw.repository.CampusRepository;
import aucasa.com.rw.repository.ElectionRepository;
import aucasa.com.rw.repository.FinanceBudgetRepository;
import aucasa.com.rw.repository.FacultyRepository;
import aucasa.com.rw.repository.RoleRepository;
import aucasa.com.rw.repository.UserAccountRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final CampusRepository campusRepository;
    private final FacultyRepository facultyRepository;
    private final UserAccountRepository userAccountRepository;
    private final AcademicTermRepository academicTermRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final ElectionRepository electionRepository;
    private final FinanceBudgetRepository financeBudgetRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(
            RoleRepository roleRepository,
            CampusRepository campusRepository,
            FacultyRepository facultyRepository,
            UserAccountRepository userAccountRepository,
            AcademicTermRepository academicTermRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            ElectionRepository electionRepository,
            FinanceBudgetRepository financeBudgetRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.campusRepository = campusRepository;
        this.facultyRepository = facultyRepository;
        this.userAccountRepository = userAccountRepository;
        this.academicTermRepository = academicTermRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.electionRepository = electionRepository;
        this.financeBudgetRepository = financeBudgetRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedActiveTermIfMissing();
        seedAdminIfMissing();
        seedDeanIfMissing();
        seedAttendanceSessionsIfMissing();
        seedElectionIfMissing();
        seedFinanceIfMissing();
        seedGuildPresidentIfMissing();
        seedFinanceBudgetIfMissing();
    }

    private void seedAdminIfMissing() {
        String adminUsername = "admin1";
        String adminEmail = "admin1@auca.ac.rw";

        if (userAccountRepository.findByUsername(adminUsername).isPresent()
                || userAccountRepository.findByEmail(adminEmail).isPresent()) {
            return;
        }

        Role adminRole = roleRepository.findByName(RoleType.ADMIN).orElseGet(() -> {
            Role role = new Role();
            role.setName(RoleType.ADMIN);
            return roleRepository.save(role);
        });

        UserAccount admin = new UserAccount();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setFirstName("Demo");
        admin.setLastName("Admin");
        admin.setRole(adminRole);
        admin.setStatus(AccountStatus.ACTIVE);
        userAccountRepository.save(admin);
    }

    private void seedActiveTermIfMissing() {
        if (academicTermRepository.findByActiveTrue().isPresent()) {
            return;
        }

        AcademicTerm term = new AcademicTerm();
        term.setName("Harmattan 2026");
        term.setAcademicYear("2025/2026");
        term.setSemesterNumber(2);
        term.setStartDate(LocalDate.now().minusMonths(1));
        term.setEndDate(LocalDate.now().plusMonths(4));
        term.setActive(true);
        academicTermRepository.save(term);
    }

    private void seedDeanIfMissing() {
        String deanUsername = "dean1";
        String deanEmail = "dean1@auca.ac.rw";

        if (userAccountRepository.findByUsername(deanUsername).isPresent()
                || userAccountRepository.findByEmail(deanEmail).isPresent()) {
            return;
        }

        Role deanRole = roleRepository.findByName(RoleType.DEAN).orElseGet(() -> {
            Role role = new Role();
            role.setName(RoleType.DEAN);
            return roleRepository.save(role);
        });

        UserAccount dean = new UserAccount();
        dean.setUsername(deanUsername);
        dean.setEmail(deanEmail);
        dean.setPasswordHash(passwordEncoder.encode("dean123"));
        dean.setFirstName("Demo");
        dean.setLastName("Dean");
        dean.setRole(deanRole);
        dean.setStatus(AccountStatus.ACTIVE);
        userAccountRepository.save(dean);
    }

    private void seedAttendanceSessionsIfMissing() {
        if (attendanceSessionRepository.count() > 0) {
            return;
        }

        AcademicTerm term = academicTermRepository.findByActiveTrue()
                .orElseGet(() -> {
                    AcademicTerm t = new AcademicTerm();
                    t.setName("Harmattan 2026");
                    t.setAcademicYear("2025/2026");
                    t.setSemesterNumber(2);
                    t.setStartDate(LocalDate.now().minusMonths(1));
                    t.setEndDate(LocalDate.now().plusMonths(4));
                    t.setActive(true);
                    return academicTermRepository.save(t);
                });

        Campus masoro = campusRepository.findByCode("MAS").orElseGet(() -> {
            Campus c = new Campus();
            c.setCode("MAS");
            c.setName("Masoro Campus");
            return campusRepository.save(c);
        });

        Campus gishushu = campusRepository.findByCode("GIS").orElseGet(() -> {
            Campus c = new Campus();
            c.setCode("GIS");
            c.setName("Gishushu Campus");
            return campusRepository.save(c);
        });

        AttendanceSession activeSession = new AttendanceSession();
        activeSession.setTitle("Gishushu General Assembly");
        activeSession.setCampus(gishushu);
        activeSession.setTerm(term);
        activeSession.setStartsAt(LocalDateTime.now().minusMinutes(30));
        activeSession.setEndsAt(LocalDateTime.now().plusHours(2));
        activeSession.setActive(true);
        attendanceSessionRepository.save(activeSession);

        AttendanceSession upcomingSession = new AttendanceSession();
        upcomingSession.setTitle("Masoro General Assembly");
        upcomingSession.setCampus(masoro);
        upcomingSession.setTerm(term);
        upcomingSession.setStartsAt(LocalDateTime.now().minusMinutes(10));
        upcomingSession.setEndsAt(LocalDateTime.now().plusHours(4));
        upcomingSession.setActive(true);
        attendanceSessionRepository.save(upcomingSession);
    }

    private void seedElectionIfMissing() {
        if (electionRepository.count() > 0) {
            return;
        }

        Election election = new Election();
        election.setTitle("AUCASA GENERAL ELECTION");
        election.setDescription("Apply to run for AUCASA leadership positions.");
        election.setNominationStart(LocalDateTime.now().minusDays(2));
        election.setNominationEnd(LocalDateTime.now().plusDays(10));
        election.setCampaignStart(LocalDateTime.now().plusDays(11));
        election.setCampaignEnd(LocalDateTime.now().plusDays(18));
        election.setVotingStart(LocalDateTime.now().plusDays(20));
        election.setVotingEnd(LocalDateTime.now().plusDays(21));
        election.setEligibleVoters(1500);
        election.setTotalVotes(0);
        election.setStatus(ElectionStatus.VOTING);
        electionRepository.save(election);
    }

    private void seedFinanceIfMissing() {
        String financeUsername = "finance1";
        String financeEmail = "finance1@auca.ac.rw";

        if (userAccountRepository.findByUsername(financeUsername).isPresent()
                || userAccountRepository.findByEmail(financeEmail).isPresent()) {
            return;
        }

        Role financeRole = roleRepository.findByName(RoleType.FINANCE).orElseGet(() -> {
            Role role = new Role();
            role.setName(RoleType.FINANCE);
            return roleRepository.save(role);
        });

        UserAccount finance = new UserAccount();
        finance.setUsername(financeUsername);
        finance.setEmail(financeEmail);
        finance.setPasswordHash(passwordEncoder.encode("finance123"));
        finance.setFirstName("Demo");
        finance.setLastName("Finance");
        finance.setRole(financeRole);
        finance.setStatus(AccountStatus.ACTIVE);
        userAccountRepository.save(finance);
    }

    private void seedGuildPresidentIfMissing() {
        String guildUsername = "guild1";
        String guildEmail = "guild1@auca.ac.rw";

        if (userAccountRepository.findByUsername(guildUsername).isPresent()
                || userAccountRepository.findByEmail(guildEmail).isPresent()) {
            return;
        }

        Role guildRole = roleRepository.findByName(RoleType.GUILD_PRESIDENT).orElseGet(() -> {
            Role role = new Role();
            role.setName(RoleType.GUILD_PRESIDENT);
            return roleRepository.save(role);
        });

        UserAccount guild = new UserAccount();
        guild.setUsername(guildUsername);
        guild.setEmail(guildEmail);
        guild.setPasswordHash(passwordEncoder.encode("guild123"));
        guild.setFirstName("Demo");
        guild.setLastName("Guild");
        guild.setRole(guildRole);
        guild.setStatus(AccountStatus.ACTIVE);
        userAccountRepository.save(guild);
    }

    private void seedFinanceBudgetIfMissing() {
        if (financeBudgetRepository.count() > 0) {
            return;
        }

        FinanceBudget budget = new FinanceBudget();
        budget.setTitle("AUCASA Core Operations");
        budget.setDepartment("Finance Office");
        budget.setFiscalYear("2025/2026");
        budget.setAssignedAmount(new BigDecimal("12000000.00"));
        budget.setUsedAmount(new BigDecimal("0.00"));
        budget.setStatus(FinanceBudgetStatus.ACTIVE);
        budget.setNotes("Primary assigned budget for student association operations.");
        financeBudgetRepository.save(budget);
    }
}
