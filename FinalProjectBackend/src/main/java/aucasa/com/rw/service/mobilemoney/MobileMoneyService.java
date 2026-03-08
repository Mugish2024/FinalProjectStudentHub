package aucasa.com.rw.service.mobilemoney;

import java.math.BigDecimal;

public interface MobileMoneyService {
    MobileMoneyPushResult initiatePush(String phoneNumber, BigDecimal amount, String receiptNumber);
}
