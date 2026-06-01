package aucasa.com.rw.repository;

import aucasa.com.rw.domain.FinanceBudget;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceBudgetRepository extends JpaRepository<FinanceBudget, Long> {
    Optional<FinanceBudget> findByTitle(String title);
    Optional<FinanceBudget> findFirstByTitleOrderByIdAsc(String title);
}
