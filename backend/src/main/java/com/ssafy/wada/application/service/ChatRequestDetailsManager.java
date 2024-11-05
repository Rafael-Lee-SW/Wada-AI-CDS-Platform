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


    public List<Map<String, Object>> getRecommendedLLM(String requestId) {
        ChatRequestDetails chatRequestDetails = chatRequestDetailsRepository.findById(requestId)
            .orElseThrow(
                () -> new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND));

        if (chatRequestDetails.getRecommendedLLM() == null) {
            log.warn("No recommended LLM found for request id {}", requestId);
        } else {
            log.info("Recommended LLM found for request id {}", requestId);
        }

        List<Map<String, Object>> recommendedLLM = chatRequestDetails.getRecommendedLLM();
        log.info("Recommended LLM found for request id {}: {}", requestId,
            recommendedLLM != null ? recommendedLLM.size() : "null");

        if (recommendedLLM == null || recommendedLLM.isEmpty()) {
            throw new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND);
        }
        return recommendedLLM;
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
        return chatRequestDetailsRepository.findFileUrlByRequestId(requestId);

    }
}
