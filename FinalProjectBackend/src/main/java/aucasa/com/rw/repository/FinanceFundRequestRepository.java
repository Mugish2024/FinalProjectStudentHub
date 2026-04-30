package aucasa.com.rw.repository;

import aucasa.com.rw.domain.FinanceFundRequest;
import aucasa.com.rw.domain.enums.FinanceFundRequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceFundRequestRepository extends JpaRepository<FinanceFundRequest, Long> {
    List<FinanceFundRequest> findByStatus(FinanceFundRequestStatus status);
    List<FinanceFundRequest> findByBudgetId(Long budgetId);
}
