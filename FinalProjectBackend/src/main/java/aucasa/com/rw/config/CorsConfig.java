package aucasa.com.rw.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                        "http://localhost:*",
                        "https://localhost:*",
                        "http://127.0.0.1:*",
                        "https://127.0.0.1:*",
                        "http://10.*:*",
                        "https://10.*:*",
                        "http://192.168.*:*",
                        "https://192.168.*:*",
                        "http://172.16.*:*",
                        "https://172.16.*:*",
                        "http://172.17.*:*",
                        "https://172.17.*:*",
                        "http://172.18.*:*",
                        "https://172.18.*:*",
                        "http://172.19.*:*",
                        "https://172.19.*:*",
                        "http://172.2*.*:*",
                        "https://172.2*.*:*",
                        "http://172.30.*:*",
                        "https://172.30.*:*",
                        "http://172.31.*:*",
                        "https://172.31.*:*"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
