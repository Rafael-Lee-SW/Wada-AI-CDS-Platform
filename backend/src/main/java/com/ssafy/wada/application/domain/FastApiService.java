package com.ssafy.wada.application.domain;

import com.ssafy.wada.application.domain.RecommendedLLM;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class FastApiService {

    private final RestTemplate restTemplate;

    @Value("${app.fastApiUrl}")
    private String apiUrl;

    public FastApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> sendToFastApi(ChatRequestDetails fileUrl, RecommendedLLM modelData) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("file_path", fileUrl);
        requestBody.put("model_data", modelData);

        // FastAPI에 요청 전송
        Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);

        // FastAPI의 응답을 resultSummary와 resultAll로 나눠서 리턴
        Map<String, Object> result = new HashMap<>();
        result.put("resultSummary", response.get("resultSummary"));
        result.put("resultAll", response.get("resultAll"));

        return result;
    }
}
