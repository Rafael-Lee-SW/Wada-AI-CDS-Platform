package com.ssafy.wada.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
@Slf4j
@Service
public class FastApiService {

    private final RestTemplate restTemplate;

    @Value("${external.fast-api}")
    private String apiUrl;

    public FastApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> sendToFastApi(String fileUrl, Object modelData) {

        Map<String, Object> requestBody = new HashMap<>();

        // fileUrl과 modelData의 필드를 requestBody에 추가
        requestBody.put("file_path", fileUrl);

        if (modelData instanceof Map) {
            Map<String, Object> modelMap = (Map<String, Object>) modelData;
            requestBody.putAll(modelMap);
        }

        log.info("fetch PastAPI DATA {}:",requestBody);
        // FastAPI에 요청 전송
        String s = restTemplate.postForObject(apiUrl, requestBody, String.class);
        log.info("string response {}", s);

        Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);

        return response;
    }
}