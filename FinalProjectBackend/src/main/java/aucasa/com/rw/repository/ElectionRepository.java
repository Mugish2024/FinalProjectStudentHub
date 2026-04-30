package aucasa.com.rw.repository;

import aucasa.com.rw.domain.Election;
import aucasa.com.rw.domain.enums.ElectionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ElectionRepository extends JpaRepository<Election, Long> {
    List<Election> findByStatus(ElectionStatus status);
    List<Election> findAllByOrderByIdDesc();
}
