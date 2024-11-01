package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import com.ssafy.wada.application.domain.RecommendedLLM;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.ChatRequestDetailsRepository;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.ModelDispatchErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

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

    public List<RecommendedLLM> getRecommendedLLM(String requestId) {
        List<RecommendedLLM> recommendedLLM = chatRequestDetailsRepository.findRecommendedLLMByRequestId(requestId);

        log.info("Fetched recommendedLLM for requestId {}: {}", requestId, recommendedLLM.size());

        if (recommendedLLM == null || recommendedLLM.isEmpty()) {
            throw new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND);
        }
        return recommendedLLM;
    }
    

    public void updateChatRequestDetails(String requestId, Map<String, Object> resultSummary,
        Map<String, Object> resultAll, Map<String, Object> resultLlmDescription) {
        ChatRequestDetails chatRequestDetails = chatRequestDetailsRepository.findByRequestId(requestId);

        chatRequestDetails.updateResults(resultSummary, resultAll, resultLlmDescription);
        chatRequestDetailsRepository.save(chatRequestDetails);
    }



    public ChatRequestDetails getFileUrl(String requestId) {
     return  chatRequestDetailsRepository.findFileUrlByRequestId(requestId);
    }
}
