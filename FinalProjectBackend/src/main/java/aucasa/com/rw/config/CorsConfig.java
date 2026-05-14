package aucasa.com.rw.config;

import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    private final String allowedOriginsRaw;

    public CorsConfig(
            @Value("${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173}") String allowedOriginsRaw
    ) {
        this.allowedOriginsRaw = allowedOriginsRaw;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> allowedOrigins = Stream.of(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(this::normalizeOrigin)
                .distinct()
                .toList();

        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    private String normalizeOrigin(String origin) {
        return origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin;
    }
}
