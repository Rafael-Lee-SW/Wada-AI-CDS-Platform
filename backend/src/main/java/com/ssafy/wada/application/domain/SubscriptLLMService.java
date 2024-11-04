package com.ssafy.wada.application.domain;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class SubscriptLLMService {

    private final RestTemplate restTemplate;

    @Value("${app.llmApiUrl}")
    private String llmApiUrl;

    public SubscriptLLMService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> requestDescription(Map<String, Object> resultSummary) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("summary", resultSummary);

        return restTemplate.postForObject(llmApiUrl, requestBody, Map.class);
    }
}
