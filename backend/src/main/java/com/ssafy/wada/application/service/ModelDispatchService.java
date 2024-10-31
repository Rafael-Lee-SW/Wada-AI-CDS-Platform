package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.ChatRoom;
import com.ssafy.wada.application.domain.FastApiService;
import com.ssafy.wada.application.domain.ModelParameter;
import com.ssafy.wada.application.domain.RecommendedLLM;
import com.ssafy.wada.application.domain.SubscriptLLMService;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.ModelParameterRepository;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.ModelDispatchErrorCode;
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

    private final ChatRoomRepository chatRoomRepository;
    private final ModelParameterRepository modelParameterRepository;
    private final FastApiService fastApiService;
    private final SubscriptLLMService subscriptLLMService;

    public ModelDispatchResponse dispatchModel(String chatRoomId, int selectedModel) {
        String requestId = getLatestMongoIdByChatRoomId(chatRoomId);
        ModelParameter modelParameter = getModelParameter(requestId);
        RecommendedLLM selectedModelData = getSelectedModelData(modelParameter, selectedModel);

        // FastAPI 호출
        Map<String, Object> analysisResult = fastApiService.sendToFastApi(modelParameter.getFileUrl(), selectedModelData);
        Map<String, Object> resultSummary = (Map<String, Object>) analysisResult.get("resultSummary");
        Map<String, Object> resultAll = (Map<String, Object>) analysisResult.get("resultAll");

        // LLM 설명 요청
        Map<String, Object> resultLlmDescription = subscriptLLMService.requestDescription(resultSummary);
        updateModelParameterWithResults(requestId, resultSummary, resultAll, resultLlmDescription);

        return ModelDispatchResponse.of(resultSummary, resultAll, resultLlmDescription);
    }

    private String getLatestMongoIdByChatRoomId(String chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
            .map(ChatRoom::getRequestId)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.CHATROOM_NOT_FOUND));
    }

    private ModelParameter getModelParameter(String mongoId) {
        return modelParameterRepository.findById(mongoId)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND));
    }

    private RecommendedLLM getSelectedModelData(ModelParameter modelParameter, int selectedModel) {
        List<RecommendedLLM> recommendedLLMList = modelParameter.getRecommendedLLM();
        return recommendedLLMList.get(selectedModel);
    }

    // ModelParameter를 업데이트하는 메서드
    private void updateModelParameterWithResults(String mongoId, Map<String, Object> resultSummary,
        Map<String, Object> resultAll, Map<String, Object> resultLlmDescription) {
        ModelParameter modelParameter = modelParameterRepository.findById(mongoId)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND));

        modelParameter.setResultSummary(resultSummary);
        modelParameter.setResultAll(resultAll);
        modelParameter.setResultLlmDescription(resultLlmDescription);
        modelParameterRepository.save(modelParameter);
    }
}
