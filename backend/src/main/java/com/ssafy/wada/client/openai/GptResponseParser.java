package com.ssafy.wada.client.openai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class GptResponseParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> parseGptResponse(String jsonResponse) {
        try {
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GPT response", e);
        }
    }
}
