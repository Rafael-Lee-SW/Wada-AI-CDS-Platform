package com.ssafy.wada.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConvertToSelectedService {


    public Map<String, Object> ConvertRecommendedModelFromLLM(Map<String, Object> recommendedModelFromLLM, int index) {
        // recommendedModelFromLLM에서 model_recommendations 필드를 가져오기
        Object modelRecommendationsObj = recommendedModelFromLLM.get("model_recommendations");

        // model_recommendations 필드를 List<Map<String, Object>> 형식으로 캐스팅
        if (modelRecommendationsObj instanceof List) {
            List<Map<String, Object>> modelRecommendations = (List<Map<String, Object>>) modelRecommendationsObj;

            // 지정된 인덱스에 있는 모델의 isSelected를 true로 설정
            if (index >= 0 && index < modelRecommendations.size()) {
                Map<String, Object> selectedModel = modelRecommendations.get(index);
                selectedModel.put("isSelected", true);
            }
        } else {
            throw new IllegalArgumentException("model_recommendations is not a List.");
        }

        // 변경된 recommendedModelFromLLM 반환
        return recommendedModelFromLLM;
    }
}