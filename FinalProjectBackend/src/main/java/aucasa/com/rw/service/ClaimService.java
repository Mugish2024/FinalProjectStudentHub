package aucasa.com.rw.service;

import aucasa.com.rw.domain.Claim;
import aucasa.com.rw.repository.ClaimRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ClaimService {
    private final ClaimRepository repository;

    public ClaimService(ClaimRepository repository) {
        this.repository = repository;
    }

    public List<Claim> findAll() { return repository.findAll(); }
    public Optional<Claim> findById(Long id) { return repository.findById(id); }
    public Claim create(Claim entity) { return repository.save(entity); }
    public void delete(Long id) { repository.deleteById(id); }
}
