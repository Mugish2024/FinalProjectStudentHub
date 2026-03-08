package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Payment;
import aucasa.com.rw.domain.enums.PaymentStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStudentId(Long studentId);
    List<Payment> findByTermId(Long termId);
    Optional<Payment> findByStudentIdAndTermId(Long studentId, Long termId);
    boolean existsByStudentIdAndTermId(Long studentId, Long termId);
    Optional<Payment> findByReceiptNumber(String receiptNumber);
    List<Payment> findByStatus(PaymentStatus status);
    long countByTermId(Long termId);
    long countByTermIdAndStatusIn(Long termId, Collection<PaymentStatus> statuses);
    List<Payment> findByTermIdAndStatusNotIn(Long termId, Collection<PaymentStatus> statuses);
}
