package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.FastApiService;
import com.ssafy.wada.application.domain.SubscriptLLMService;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModelDispatchService {

    private final FastApiService fastApiService;
    private final SubscriptLLMService subscriptLLMService;
    private final ChatRequestDetailsManager chatRequestDetailsManager;

    public ModelDispatchResponse dispatchModel(String chatRoomId, int selectedModel) {
        log.info("Dispatching model for Chat Room ID: {} and Selected Model Index: {}", chatRoomId, selectedModel);

        // Request ID 조회
        String requestId = chatRequestDetailsManager.getRequestIdByChatRoomId(chatRoomId);
        log.info("Fetched MongoDB Request ID: {}", requestId);

        // Recommended LLM 데이터 조회
        List<Map<String, Object>> chatRequestDetails = chatRequestDetailsManager.getRecommendedLLM(requestId);
        log.info("Fetched recommended LLM list for Request ID: {}", requestId);

        // 선택된 모델 데이터 추출
        Map<String, Object> selectedModelData = getModelRecommendationAtIndex(chatRequestDetails, selectedModel);
        log.info("Selected Model Data: {}", selectedModelData);

        // FastAPI 호출
        Map<String, Object> analysisResult = fastApiService.sendToFastApi(chatRequestDetailsManager.getFileUrl(requestId), selectedModelData);
        log.info("Received analysis result from FastAPI");

        Map<String, Object> resultSummary = (Map<String, Object>) analysisResult.get("resultSummary");
        Map<String, Object> resultAll = (Map<String, Object>) analysisResult.get("resultAll");

        // LLM 설명 요청
        Map<String, Object> resultLlmDescription = subscriptLLMService.requestDescription(resultSummary);
        log.info("Fetched LLM description");

        // DB 업데이트
        chatRequestDetailsManager.updateChatRequestDetails(requestId, resultSummary, resultAll, resultLlmDescription);
        log.info("Updated Chat Request Details for Request ID: {}", requestId);

        log.info("Model dispatch completed for Chat Room ID: {}", chatRoomId);
        return ModelDispatchResponse.of(resultSummary, resultAll, resultLlmDescription);
    }

    private Map<String, Object> getModelRecommendationAtIndex(
        List<Map<String, Object>> recommendedModel, int selectedModel) {

        if (recommendedModel != null && !recommendedModel.isEmpty()) {
            // Assuming recommendedModel has only one entry with the model_recommendations
            Map<String, Object> llmData = recommendedModel.get(0); // 첫 번째 recommendedLLM 데이터 가져오기
            List<Map<String, Object>> modelRecommendations = (List<Map<String, Object>>) llmData.get("model_recommendations");

            if (modelRecommendations != null && modelRecommendations.size() > selectedModel) {
                return modelRecommendations.get(selectedModel); // 원하는 인덱스의 model_recommendation 반환
            } else {
                throw new IndexOutOfBoundsException("Selected model index is out of bounds for model_recommendations list.");
            }
        } else {
            throw new IllegalStateException("No recommended LLM data found.");
        }
    }


}
