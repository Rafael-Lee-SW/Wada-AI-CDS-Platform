package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import com.ssafy.wada.application.domain.FastApiService;
import com.ssafy.wada.application.domain.RecommendedLLM;
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
        String requestId = chatRequestDetailsManager.getLatestMongoIdByChatRoomId(chatRoomId);
        ChatRequestDetails chatRequestDetails = chatRequestDetailsManager.getChatRequestDetails(requestId);
        RecommendedLLM selectedModelData = getSelectedModelData(chatRequestDetails, selectedModel);

        // FastAPI 호출
        Map<String, Object> analysisResult = fastApiService.sendToFastApi(chatRequestDetails.getFileUrl(), selectedModelData);
        Map<String, Object> resultSummary = (Map<String, Object>) analysisResult.get("resultSummary");
        Map<String, Object> resultAll = (Map<String, Object>) analysisResult.get("resultAll");

        // LLM 설명 요청
        Map<String, Object> resultLlmDescription = subscriptLLMService.requestDescription(resultSummary);
        chatRequestDetailsManager.updateChatRequestDetails(requestId, resultSummary, resultAll, resultLlmDescription);

        return ModelDispatchResponse.of(resultSummary, resultAll, resultLlmDescription);
    }

    private RecommendedLLM getSelectedModelData(ChatRequestDetails chatRequestDetails, int selectedModel) {
        List<RecommendedLLM> recommendedLLMList = chatRequestDetails.getRecommendedLLM();
        return recommendedLLMList.get(selectedModel);
    }
}
