package com.ssafy.wada.application.domain;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.Map;

@Data
@Builder
@Document(collection = "modelParameters")
public class ChatRequestDetails {

    @Id
    private String requestId;
    private String fileUrl;     //csv file 저장용

    private List<RecommendedLLM> recommendedLLM; //모델 추천 저장
    private Map<String, Object> resultSummary; // 최종 결과 요약(llm description 요청용)
    private Map<String, Object> resultAll; // 최종 결과 All
    private Map<String, Object> resultLlmDescription; //최종 llm 설명



    public void updateResults(Map<String, Object> resultSummary, Map<String, Object> resultAll, Map<String, Object> resultLlmDescription) {
        this.resultSummary = resultSummary;
        this.resultAll = resultAll;
        this.resultLlmDescription = resultLlmDescription;
    }
}

