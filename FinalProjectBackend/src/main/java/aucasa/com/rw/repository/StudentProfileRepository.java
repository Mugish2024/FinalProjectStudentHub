package aucasa.com.rw.repository;

import aucasa.com.rw.domain.StudentProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByStudentNumber(String studentNumber);
}
