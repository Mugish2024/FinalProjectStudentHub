package aucasa.com.rw.controller;

import aucasa.com.rw.dto.election.VoteRequest;
import aucasa.com.rw.dto.election.VoteResponse;
import aucasa.com.rw.service.VoteService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/elections/votes")
public class VoteController {
    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping
    public ResponseEntity<?> vote(@RequestBody VoteRequest request) {
        try {
            VoteResponse response = voteService.castVote(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }
}
