package aucasa.com.rw.dto.ai;

public class AiResponse {
    private String answer;
    private boolean fromModel;

    public AiResponse(String answer, boolean fromModel) {
        this.answer = answer;
        this.fromModel = fromModel;
    }

    public String getAnswer() {
        return answer;
    }

    public boolean isFromModel() {
        return fromModel;
    }
}
