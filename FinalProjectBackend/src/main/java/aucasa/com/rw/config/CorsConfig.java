package aucasa.com.rw.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    private final String allowedOriginsRaw;
    private final String labourUploadDir;

    public CorsConfig(
            @Value("${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173,http://10.*.*.*:5173,https://10.*.*.*:5173,http://192.168.*.*:5173,https://192.168.*.*:5173,http://172.16.*.*:5173,https://172.16.*.*:5173,http://172.17.*.*:5173,https://172.17.*.*:5173,http://172.18.*.*:5173,https://172.18.*.*:5173,http://172.19.*.*:5173,https://172.19.*.*:5173,http://172.20.*.*:5173,https://172.20.*.*:5173,http://172.21.*.*:5173,https://172.21.*.*:5173,http://172.22.*.*:5173,https://172.22.*.*:5173,http://172.23.*.*:5173,https://172.23.*.*:5173,http://172.24.*.*:5173,https://172.24.*.*:5173,http://172.25.*.*:5173,https://172.25.*.*:5173,http://172.26.*.*:5173,https://172.26.*.*:5173,http://172.27.*.*:5173,https://172.27.*.*:5173,http://172.28.*.*:5173,https://172.28.*.*:5173,http://172.29.*.*:5173,https://172.29.*.*:5173,http://172.30.*.*:5173,https://172.30.*.*:5173,http://172.31.*.*:5173,https://172.31.*.*:5173,https://*.loca.lt,https://*.trycloudflare.com}") String allowedOriginsRaw,
            @Value("${app.storage.labour-upload-dir:}") String labourUploadDir
    ) {
        this.allowedOriginsRaw = allowedOriginsRaw;
        this.labourUploadDir = labourUploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = (labourUploadDir == null || labourUploadDir.isBlank())
                ? Paths.get(System.getProperty("user.home"), "FinalProjectStudentHubUploads", "labour")
                : Paths.get(labourUploadDir);
        registry.addResourceHandler("/uploads/labour/**")
                .addResourceLocations("file:" + dir.toAbsolutePath().normalize() + "/");
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
                .allowedOriginPatterns(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    private String normalizeOrigin(String origin) {
        return origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin;
    }
}
