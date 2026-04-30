package aucasa.com.rw.repository;

import aucasa.com.rw.domain.LabourActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabourActivityRepository extends JpaRepository<LabourActivity, Long> {
    List<LabourActivity> findByActiveTrueOrderByCreatedAtDesc();
}

