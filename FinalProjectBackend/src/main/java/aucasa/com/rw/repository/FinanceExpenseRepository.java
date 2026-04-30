package aucasa.com.rw.repository;

import aucasa.com.rw.domain.FinanceExpense;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceExpenseRepository extends JpaRepository<FinanceExpense, Long> {
    List<FinanceExpense> findByExpenseDateBetween(LocalDate start, LocalDate end);
}
