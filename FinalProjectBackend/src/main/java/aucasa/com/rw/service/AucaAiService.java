package aucasa.com.rw.service;

import aucasa.com.rw.dto.ai.AiResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Service
public class AucaAiService {
    private final RestTemplate restTemplate;
    private final String geminiApiKey;
    private final String geminiModel;
    private final String geminiBaseUrl;
    private final String knowledgeBase;

    public AucaAiService(
            @Value("${gemini.api.key:}") String geminiApiKey,
            @Value("${gemini.model:gemini-2.0-flash}") String geminiModel,
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String geminiBaseUrl,
            @Value("${gemini.timeout-ms:20000}") int timeoutMs
    ) {
        this.geminiApiKey = geminiApiKey;
        this.geminiModel = geminiModel;
        this.geminiBaseUrl = geminiBaseUrl;
        this.knowledgeBase = loadKnowledge();
        this.restTemplate = buildRestTemplate(timeoutMs);
    }

    public AiResponse answerQuestion(String question) {
        if (question == null || question.trim().isEmpty()) {
            return new AiResponse("Please type your question about AUCA or AUCASA.", false);
        }
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return new AiResponse("AI is not configured yet. Set GEMINI_API_KEY on the server.", false);
        }

        String systemPrompt = """
                You are the AUCASA information assistant. Answer only using the Knowledge Base.
                If the answer is not found in the Knowledge Base, say:
                "I do not have a verified answer for that yet. Please confirm with the AUCASA office."
                Keep answers short, factual, and in plain English.
                """;

        Map<String, Object> payload = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("text", systemPrompt),
                                Map.of("text", "Knowledge Base:\n" + knowledgeBase),
                                Map.of("text", "Question:\n" + question.trim())
                        ))
                )
        );

        Map<String, String> headers = Map.of(
                "x-goog-api-key", geminiApiKey,
                "Content-Type", "application/json"
        );

        try {
            String url = geminiBaseUrl + "/" + geminiModel + ":generateContent";
            var response = restTemplate.postForEntity(url,
                    new org.springframework.http.HttpEntity<>(payload, toHeaders(headers)),
                    Map.class);
            String answer = extractText(response.getBody());
            if (answer == null || answer.isBlank()) {
                return new AiResponse("I do not have a verified answer for that yet. Please confirm with the AUCASA office.", true);
            }
            return new AiResponse(answer.trim(), true);
        } catch (HttpStatusCodeException ex) {
            String body = ex.getResponseBodyAsString();
            String trimmed = body != null && body.length() > 400 ? body.substring(0, 400) + "..." : body;
            return new AiResponse("Gemini API error (" + ex.getStatusCode().value() + "): " + trimmed, false);
        } catch (Exception ex) {
            return new AiResponse("AI service error. Please try again later.", false);
        }
    }

    private org.springframework.http.HttpHeaders toHeaders(Map<String, String> map) {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        map.forEach(headers::set);
        return headers;
    }

    @SuppressWarnings("unchecked")
    private String extractText(Object body) {
        if (!(body instanceof Map<?, ?> map)) {
            return null;
        }
        Object candidates = map.get("candidates");
        if (!(candidates instanceof List<?> candidateList) || candidateList.isEmpty()) {
            return null;
        }
        Object first = candidateList.get(0);
        if (!(first instanceof Map<?, ?> firstMap)) {
            return null;
        }
        Object content = firstMap.get("content");
        if (!(content instanceof Map<?, ?> contentMap)) {
            return null;
        }
        Object parts = contentMap.get("parts");
        if (!(parts instanceof List<?> partsList)) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        for (Object part : partsList) {
            if (!(part instanceof Map<?, ?> partMap)) continue;
            Object text = partMap.get("text");
            if (text != null) {
                builder.append(text.toString());
            }
        }
        return builder.length() > 0 ? builder.toString() : null;
    }

    private String loadKnowledge() {
        try {
            ClassPathResource resource = new ClassPathResource("auca_knowledge.txt");
            if (!resource.exists()) {
                return "No knowledge base available.";
            }
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return "No knowledge base available.";
        }
    }

    private RestTemplate buildRestTemplate(int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        return new RestTemplate(factory);
    }
}
