package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.ChatRequestDetailsRepository;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.ModelDispatchErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatRequestDetailsManager {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRequestDetailsRepository chatRequestDetailsRepository;

    public String getRequestIdByChatRoomId(String chatRoomId) {
        return chatRoomRepository.findRequestIdByChatRoomId(chatRoomId)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.CHATROOM_NOT_FOUND));
    }

    public List<Map<String, Object>> getModelRecommendations(String requestId) {
        log.info("Initiating fetch for model recommendations with Request ID: {}", requestId);

        Map<String, Object> data = chatRequestDetailsRepository.findRecommendedLLMById(requestId);

        // 전체 반환 값 확인
        log.info("Fetched data: {}", data);

        // recommendedLLM 필드 확인
        if (data == null || !data.containsKey("recommendedLLM")) {
            log.warn("No 'recommendedLLM' field found in the document for Request ID: {}", requestId);
            throw new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND);
        }

        List<Map<String, Object>> modelRecommendations = (List<Map<String, Object>>) data.get("recommendedLLM");

        // 빈 리스트 또는 null 확인
        if (modelRecommendations == null || modelRecommendations.isEmpty()) {
            log.warn("The model recommendations list is either null or empty for Request ID: {}", requestId);
            throw new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND);
        }

        log.info("Successfully fetched model recommendations for Request ID: {}. List size: {}", requestId, modelRecommendations.size());
        return modelRecommendations;
    }

    public void updateChatRequestDetails(String requestId, Map<String, Object> resultSummary,
        Map<String, Object> resultAll, Map<String, Object> resultLlmDescription) {
        ChatRequestDetails chatRequestDetails = chatRequestDetailsRepository.findById(requestId)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND));

        log.info("Updating ChatRequestDetails for requestId: {}", requestId);
        chatRequestDetails.updateResults(resultSummary, resultAll, resultLlmDescription);
        chatRequestDetailsRepository.save(chatRequestDetails);
    }

    public String getFileUrl(String requestId) {
        return chatRequestDetailsRepository.findById(requestId)
            .map(ChatRequestDetails::getFileUrl)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND));
    }
}
