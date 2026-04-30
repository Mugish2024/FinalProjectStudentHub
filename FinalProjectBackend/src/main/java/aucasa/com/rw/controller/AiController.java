package aucasa.com.rw.controller;

import aucasa.com.rw.dto.ai.AiRequest;
import aucasa.com.rw.dto.ai.AiResponse;
import aucasa.com.rw.service.AucaAiService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173", "http://10.*.*.*:5173", "https://10.*.*.*:5173", "https://*.loca.lt", "https://*.trycloudflare.com"})
public class AiController {
    private final AucaAiService aucaAiService;

    public AiController(AucaAiService aucaAiService) {
        this.aucaAiService = aucaAiService;
    }

    @PostMapping("/auca")
    public ResponseEntity<?> ask(@RequestBody AiRequest request) {
        try {
            AiResponse response = aucaAiService.answerQuestion(request.getQuestion());
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", "AI service error."));
        }
    }
}

