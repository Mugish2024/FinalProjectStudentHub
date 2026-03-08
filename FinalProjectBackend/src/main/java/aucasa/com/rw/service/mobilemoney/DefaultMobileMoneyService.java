package aucasa.com.rw.service.mobilemoney;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class DefaultMobileMoneyService implements MobileMoneyService {

    private final RestTemplate restTemplate;

    @Value("${app.payment.mobile-money.simulate:true}")
    private boolean simulate;

    @Value("${app.payment.mobile-money.provider-url:}")
    private String providerUrl;

    @Value("${app.payment.mobile-money.api-key:}")
    private String apiKey;

    @Value("${app.payment.mobile-money.callback-url:}")
    private String callbackUrl;

    public DefaultMobileMoneyService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    @Override
    public MobileMoneyPushResult initiatePush(String phoneNumber, BigDecimal amount, String receiptNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        if (normalizedPhone == null) {
            return new MobileMoneyPushResult(false, null, "Invalid Rwanda mobile number. Use 078/079... or 25078/25079...");
        }

        if (simulate) {
            String simulatedRef = "SIM-" + UUID.randomUUID();
            return new MobileMoneyPushResult(
                    true,
                    simulatedRef,
                    "Simulation mode enabled. No real phone prompt was sent to " + normalizedPhone + "."
            );
        }

        if (providerUrl == null || providerUrl.isBlank()) {
            return new MobileMoneyPushResult(false, null, "Provider URL is not configured.");
        }
        if (apiKey == null || apiKey.isBlank()) {
            return new MobileMoneyPushResult(false, null, "Provider API key is not configured.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("phoneNumber", normalizedPhone);
        payload.put("amount", amount);
        payload.put("currency", "RWF");
        payload.put("reference", receiptNumber);
        payload.put("callbackUrl", callbackUrl);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    providerUrl,
                    new HttpEntity<>(payload, headers),
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                Object ref = response.getBody() != null ? response.getBody().get("providerReference") : null;
                String providerReference = ref != null ? ref.toString() : "PROVIDER-" + UUID.randomUUID();
                return new MobileMoneyPushResult(true, providerReference, "Push initiated successfully.");
            }

            return new MobileMoneyPushResult(false, null, "Provider rejected request: " + response.getStatusCode());
        } catch (Exception ex) {
            return new MobileMoneyPushResult(false, null, "Provider call failed: " + ex.getMessage());
        }
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }

        String digits = phoneNumber.replaceAll("[^0-9]", "");
        if (digits.startsWith("250") && digits.length() == 12) {
            return digits;
        }
        if (digits.startsWith("07") && digits.length() == 10) {
            return "250" + digits.substring(1);
        }
        return null;
    }
}
