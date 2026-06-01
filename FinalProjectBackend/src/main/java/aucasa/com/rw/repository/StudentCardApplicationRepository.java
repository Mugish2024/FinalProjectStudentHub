package aucasa.com.rw.repository;

import aucasa.com.rw.domain.StudentCardApplication;
import aucasa.com.rw.domain.enums.StudentCardApplicationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentCardApplicationRepository extends JpaRepository<StudentCardApplication, Long> {
    List<StudentCardApplication> findAllByOrderByAppliedAtDesc();
    List<StudentCardApplication> findByStatusOrderByAppliedAtDesc(StudentCardApplicationStatus status);
    Optional<StudentCardApplication> findFirstByStudentStudentNumberOrderByAppliedAtDesc(String studentNumber);
    Optional<StudentCardApplication> findFirstByStudentStudentNumberAndStatusOrderByAppliedAtDesc(String studentNumber, StudentCardApplicationStatus status);
    boolean existsByStudentStudentNumber(String studentNumber);
}
