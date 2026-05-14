package aucasa.com.rw.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ImsPaymentGatewayService {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String baseUrl;
    private final String bearerToken;
    private final String apiKey;

    public ImsPaymentGatewayService(
            ObjectMapper objectMapper,
            @Value("${app.ims.base-url:https://auca-ims.onrender.com}") String baseUrl,
            @Value("${app.ims.bearer-token:}") String bearerToken,
            @Value("${app.ims.api-key:}") String apiKey
    ) {
        this.objectMapper = objectMapper;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.bearerToken = bearerToken != null ? bearerToken.trim() : "";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public Map<String, Object> fetchStudentPaymentSnapshot(String studentId) {
        if (isBlank(studentId)) {
            throw new IllegalArgumentException("studentId is required.");
        }
        if (!isConfigured()) {
            throw new IllegalArgumentException("IMS API credentials are not configured.");
        }

        String encodedId = studentId.trim();
        Map<String, Object> result = new HashMap<>();
        result.put("studentId", encodedId);
        result.put("balance", getJson("/api/v1/finance/student-payments/" + encodedId + "/balance"));
        result.put("fees", getJson("/api/v1/finance/student-payments/" + encodedId + "/fees"));
        result.put("paymentInfo", getJson("/api/v1/finance/student-payments/" + encodedId + "/payment-info"));
        return result;
    }

    public Map<String, Object> fetchAllStudentPayments() {
        if (!isConfigured()) {
            throw new IllegalArgumentException("IMS API credentials are not configured.");
        }

        List<Map<String, Object>> all = new ArrayList<>();
        int page = 1;
        int totalPages = 1;
        int pageSize = 200;

        while (page <= totalPages) {
            JsonNode node = getJsonNode("/api/v1/finance/student-payments/all?page=" + page + "&size=" + pageSize);
            if (node == null || !node.isObject()) {
                break;
            }

            JsonNode dataNode = node.get("data");
            if (dataNode != null && dataNode.isArray()) {
                for (JsonNode item : dataNode) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> row = objectMapper.convertValue(item, Map.class);
                    all.add(row);
                }
            }

            int parsedTotalPages = node.path("totalPages").asInt(totalPages);
            totalPages = Math.max(1, parsedTotalPages);
            page++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("source", "IMS");
        result.put("count", all.size());
        result.put("data", all);
        return result;
    }

    private Object getJson(String path) {
        try {
            JsonNode node = getJsonNode(path);
            if (node == null) {
                return Map.of("message", "No data");
            }
            return objectMapper.convertValue(node, Object.class);
        } catch (Exception ex) {
            return Map.of("error", ex.getMessage());
        }
    }

    private JsonNode getJsonNode(String path) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .GET();
        if (!isBlank(apiKey)) {
            builder.header("x-ims-api-key", apiKey);
        }
        if (!isBlank(bearerToken)) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }
        HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300 || response.body() == null || response.body().isBlank()) {
            return null;
        }
        return objectMapper.readTree(response.body());
    }

    private boolean isConfigured() {
        return !isBlank(baseUrl) && (!isBlank(apiKey) || !isBlank(bearerToken));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimTrailingSlash(String value) {
        if (isBlank(value)) return "";
        String v = value.trim();
        while (v.endsWith("/")) v = v.substring(0, v.length() - 1);
        return v;
    }
}
