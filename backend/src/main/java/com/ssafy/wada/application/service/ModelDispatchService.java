package com.ssafy.wada.application.service;

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

        String requestId = chatRequestDetailsManager.getRequestIdByChatRoomId(chatRoomId);
        log.info("Fetched Request ID: {}", requestId);

        // Recommended LLM 데이터 조회
        List<Map<String, Object>> modelRecommendations = chatRequestDetailsManager.getModelRecommendations(requestId);
        log.info("Fetched model recommendations for Request ID: {}", requestId);

        if (selectedModel >= modelRecommendations.size()) {
            throw new IndexOutOfBoundsException("Selected model index is out of bounds for model_recommendations list.");
        }

        Map<String, Object> selectedModelData = modelRecommendations.get(selectedModel);
        log.info("Selected Model Data: {}", selectedModelData);

        Map<String, Object> analysisResult = fastApiService.sendToFastApi(
            chatRequestDetailsManager.getFileUrl(requestId), selectedModelData
        );
        log.info("Received analysis result from FastAPI");

        Map<String, Object> resultSummary = (Map<String, Object>) analysisResult.get("resultSummary");
        Map<String, Object> resultAll = (Map<String, Object>) analysisResult.get("resultAll");

        Map<String, Object> resultLlmDescription = subscriptLLMService.requestDescription(resultSummary);
        log.info("Fetched LLM description");

        chatRequestDetailsManager.updateChatRequestDetails(requestId, resultSummary, resultAll, resultLlmDescription);
        log.info("Updated Chat Request Details for Request ID: {}", requestId);

        return ModelDispatchResponse.of(resultSummary, resultAll, resultLlmDescription);
    }

    private Map<String, Object> getModelRecommendationAtIndex(
        List<Map<String, Object>> recommendedLLMList, int selectedModel) {

        if (recommendedLLMList != null && !recommendedLLMList.isEmpty()) {
            Map<String, Object> llmData = recommendedLLMList.get(0);
            List<Map<String, Object>> modelRecommendations = (List<Map<String, Object>>) llmData.get("model_recommendations");

            if (modelRecommendations != null && modelRecommendations.size() > selectedModel) {
                return modelRecommendations.get(selectedModel);
            } else {
                throw new IndexOutOfBoundsException("Selected model index is out of bounds for model_recommendations list.");
            }
        } else {
            throw new IllegalStateException("No recommended LLM data found.");
        }
    }
}
