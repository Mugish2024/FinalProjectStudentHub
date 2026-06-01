package aucasa.com.rw.repository;

import aucasa.com.rw.domain.FinanceIncome;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceIncomeRepository extends JpaRepository<FinanceIncome, Long> {
    List<FinanceIncome> findByIncomeDateBetween(LocalDate start, LocalDate end);
}
