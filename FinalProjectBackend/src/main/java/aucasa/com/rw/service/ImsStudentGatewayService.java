package aucasa.com.rw.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ImsStudentGatewayService {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String baseUrl;
    private final String bearerToken;
    private final String apiKey;

    public ImsStudentGatewayService(
            ObjectMapper objectMapper,
            @Value("${app.ims.base-url:https://auca-ims.onrender.com}") String baseUrl,
            @Value("${app.ims.bearer-token:}") String bearerToken,
            @Value("${app.ims.api-key:}") String apiKey
    ) {
        this.objectMapper = objectMapper;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.bearerToken = bearerToken != null ? bearerToken.trim() : "";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Optional<ImsStudentRecord> findStudentById(String studentId) {
        if (studentId == null || studentId.trim().isEmpty() || (!hasBearerToken() && !hasApiKey())) {
            return Optional.empty();
        }

        String normalizedStudentId = studentId.trim();
        Optional<ImsStudentRecord> fromCommonStudent = fetchStudentFromCommonStudentEndpoint(normalizedStudentId);
        if (fromCommonStudent.isPresent()) {
            return fromCommonStudent;
        }
        Optional<ImsStudentRecord> fromGrades = fetchStudentFromGradesEndpoint(normalizedStudentId);
        if (fromGrades.isPresent()) {
            return fromGrades;
        }
        return findStudentByIdFromRosterFallback(normalizedStudentId);
    }

    public List<Map<String, Object>> fetchAllStudentsRaw() {
        if (!isConfigured()) {
            return List.of();
        }

        List<Map<String, Object>> all = fetchFromPagedEndpoint("/api/v1/common/student/all");
        if (!all.isEmpty()) return all;

        all = fetchFromPagedEndpoint("/api/v1/common/student");
        if (!all.isEmpty()) return all;

        all = fetchFromPagedEndpoint("/api/v1/common/student/search");
        if (!all.isEmpty()) return all;

        return fetchStudentsFromGradesFallback();
    }

    private List<Map<String, Object>> fetchStudentsFromGradesFallback() {
        List<Map<String, Object>> rows = new ArrayList<>();

        List<Map<String, Object>> gradeRows = fetchFromPagedEndpoint("/api/v1/grades/all");
        if (gradeRows.isEmpty()) {
            gradeRows = fetchFromPagedEndpoint("/api/v1/grades");
        }
        if (gradeRows.isEmpty()) {
            return List.of();
        }

        Map<String, Map<String, Object>> uniqueById = new LinkedHashMap<>();
        for (Map<String, Object> row : gradeRows) {
            String studentId = firstNonBlank(
                    asString(row.get("studentId")),
                    asString(row.get("studentCode")),
                    asString(row.get("studentNumber")),
                    asString(row.get("id"))
            );
            if (isBlank(studentId)) {
                continue;
            }

            String key = normalizeId(studentId);
            if (isBlank(key) || uniqueById.containsKey(key)) {
                continue;
            }

            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("studentId", studentId);
            mapped.put("studentNumber", firstNonBlank(
                    asString(row.get("studentNumber")),
                    asString(row.get("studentCode")),
                    studentId
            ));
            mapped.put("studentName", firstNonBlank(
                    asString(row.get("studentName")),
                    asString(row.get("name")),
                    (asString(row.get("firstName")) + " " + asString(row.get("lastName"))).trim(),
                    "Unknown"
            ));
            mapped.put("department", firstNonBlank(
                    asString(row.get("department")),
                    asString(row.get("departmentCode")),
                    asString(row.get("departmentName"))
            ));
            mapped.put("program", asString(row.get("program")));
            uniqueById.put(key, mapped);
        }

        rows.addAll(uniqueById.values());
        return rows;
    }

    private Optional<ImsStudentRecord> fetchStudentFromCommonStudentEndpoint(String studentId) {
        String url = baseUrl + "/api/v1/common/student?studentId=" + studentId;
        return executeRequest(url, root -> {
            String id = text(root, "id");
            if (isBlank(id)) {
                return Optional.empty();
            }
            return Optional.of(new ImsStudentRecord(
                    id,
                    text(root, "name"),
                    text(root, "email"),
                    text(root, "departmentCode"),
                    text(root, "program"),
                    text(root, "status"),
                    new BigDecimal("0.00"),
                    0,
                    1
            ));
        });
    }

    private Optional<ImsStudentRecord> fetchStudentFromGradesEndpoint(String studentId) {
        String url = baseUrl + "/api/v1/grades?studentId=" + studentId;
        return executeRequest(url, root -> {
            String id = text(root, "studentId");
            if (isBlank(id)) {
                return Optional.empty();
            }
            AcademicMetrics metrics = extractAcademicMetrics(root.get("grades"));
            return Optional.of(new ImsStudentRecord(
                    id,
                    text(root, "studentName"),
                    "",
                    normalizeDepartment(text(root, "department")),
                    text(root, "program"),
                    "",
                    metrics.gpa(),
                    metrics.earnedCredits(),
                    metrics.semester()
            ));
        });
    }

    private Optional<ImsStudentRecord> findStudentByIdFromRosterFallback(String studentId) {
        List<Map<String, Object>> rows = fetchAllStudentsRaw();
        if (rows.isEmpty()) {
            return Optional.empty();
        }

        String target = normalizeId(studentId);
        for (Map<String, Object> row : rows) {
            String mappedStudentId = firstNonBlank(
                    asString(row.get("studentId")),
                    asString(row.get("id")),
                    asString(row.get("studentCode")),
                    asString(row.get("studentNumber"))
            );

            if (normalizeId(mappedStudentId).equals(target)) {
                return Optional.of(new ImsStudentRecord(
                        mappedStudentId,
                        firstNonBlank(
                                asString(row.get("studentName")),
                                asString(row.get("name")),
                                (asString(row.get("firstName")) + " " + asString(row.get("lastName"))).trim()
                        ),
                        asString(row.get("email")),
                        firstNonBlank(
                                asString(row.get("departmentCode")),
                                asString(row.get("departmentName")),
                                asString(row.get("department"))
                        ),
                        asString(row.get("program")),
                        asString(row.get("status")),
                        new BigDecimal("0.00"),
                        0,
                        1
                ));
            }
        }
        return Optional.empty();
    }

    private AcademicMetrics extractAcademicMetrics(JsonNode gradesNode) {
        if (gradesNode == null || !gradesNode.isArray()) {
            return new AcademicMetrics(new BigDecimal("0.00"), 0, 1);
        }

        BigDecimal totalScore = BigDecimal.ZERO;
        int gradedCount = 0;
        int earnedCredits = 0;
        Set<String> termIds = new HashSet<>();

        for (JsonNode gradeNode : gradesNode) {
            if (gradeNode == null || gradeNode.isNull()) {
                continue;
            }
            BigDecimal score = decimal(gradeNode, "score");
            int courseCredits = integer(gradeNode, "courseCredits");
            String termId = text(gradeNode, "termId");
            if (!isBlank(termId)) {
                termIds.add(termId);
            }
            if (score.compareTo(BigDecimal.ZERO) > 0) {
                totalScore = totalScore.add(score);
                gradedCount++;
            }
            if (score.compareTo(new BigDecimal("10.0")) >= 0 && courseCredits > 0) {
                earnedCredits += courseCredits;
            }
        }

        BigDecimal gpa = gradedCount > 0
                ? totalScore.divide(BigDecimal.valueOf(gradedCount), 2, RoundingMode.HALF_UP)
                : new BigDecimal("0.00");
        int semester = Math.max(1, termIds.size());
        return new AcademicMetrics(gpa, Math.max(0, earnedCredits), semester);
    }

    private BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value.asText("0").trim());
        } catch (Exception ex) {
            return BigDecimal.ZERO;
        }
    }

    private int integer(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return 0;
        }
        try {
            return Integer.parseInt(value.asText("0").trim());
        } catch (Exception ex) {
            return 0;
        }
    }

    private String normalizeDepartment(String value) {
        if (isBlank(value)) {
            return "General";
        }
        return value.trim();
    }

    private Optional<ImsStudentRecord> executeRequest(String url, ResponseParser parser) {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json")
                .GET();
        if (hasApiKey()) {
            requestBuilder.header("x-ims-api-key", apiKey);
        }
        if (hasBearerToken()) {
            requestBuilder.header("Authorization", "Bearer " + bearerToken);
        }

        HttpRequest request = requestBuilder.build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || response.body() == null || response.body().isBlank()) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (root == null || root.isNull()) {
                return Optional.empty();
            }
            return parser.parse(root);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private List<Map<String, Object>> fetchFromPagedEndpoint(String path) {
        List<Map<String, Object>> all = new ArrayList<>();
        int page = 1;
        int totalPages = 1;
        final int size = 200;

        while (page <= totalPages) {
            String url = baseUrl + path + "?page=" + page + "&size=" + size;
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("Accept", "application/json")
                    .GET();
            if (hasApiKey()) {
                requestBuilder.header("x-ims-api-key", apiKey);
            }
            if (hasBearerToken()) {
                requestBuilder.header("Authorization", "Bearer " + bearerToken);
            }

            try {
                HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() < 200 || response.statusCode() >= 300 || response.body() == null || response.body().isBlank()) {
                    return List.of();
                }

                JsonNode root = objectMapper.readTree(response.body());
                JsonNode dataNode = root.get("data");
                if (dataNode == null || !dataNode.isArray()) {
                    // Some endpoints return a plain array.
                    if (root.isArray()) {
                        for (JsonNode row : root) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> mapped = objectMapper.convertValue(row, Map.class);
                            all.add(mapped);
                        }
                        return all;
                    }

                    // Other endpoints may return rows under a named array key.
                    JsonNode firstArray = null;
                    if (root.isObject()) {
                        if (root.has("grades") && root.get("grades").isArray()) {
                            firstArray = root.get("grades");
                        } else if (root.has("items") && root.get("items").isArray()) {
                            firstArray = root.get("items");
                        } else if (root.has("rows") && root.get("rows").isArray()) {
                            firstArray = root.get("rows");
                        }
                    }
                    if (firstArray != null) {
                        for (JsonNode row : firstArray) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> mapped = objectMapper.convertValue(row, Map.class);
                            all.add(mapped);
                        }
                        return all;
                    }
                    return List.of();
                }

                for (JsonNode row : dataNode) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> mapped = objectMapper.convertValue(row, Map.class);
                    all.add(mapped);
                }

                totalPages = Math.max(1, root.path("totalPages").asInt(1));
                page++;
            } catch (Exception ex) {
                return List.of();
            }
        }

        return all;
    }

    public boolean isConfigured() {
        return !isBlank(baseUrl) && (hasApiKey() || hasBearerToken());
    }

    private boolean hasBearerToken() {
        return !isBlank(bearerToken);
    }

    private boolean hasApiKey() {
        return !isBlank(apiKey);
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? "" : value.asText("").trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private String normalizeId(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String result = value.trim();
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    public record ImsStudentRecord(
            String id,
            String name,
            String email,
            String departmentCode,
            String program,
            String status,
            BigDecimal gpa,
            Integer earnedCredits,
            Integer semester
    ) {}

    private record AcademicMetrics(
            BigDecimal gpa,
            Integer earnedCredits,
            Integer semester
    ) {}

    @FunctionalInterface
    private interface ResponseParser {
        Optional<ImsStudentRecord> parse(JsonNode root);
    }
}
