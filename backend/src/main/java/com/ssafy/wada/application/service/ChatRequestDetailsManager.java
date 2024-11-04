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

        // 데이터베이스에서 Request ID로 ChatRequestDetails를 조회
        Optional<ChatRequestDetails> optionalChatRequestDetails = chatRequestDetailsRepository.findById(requestId);

        // 조회된 데이터가 존재하는지 확인하는 로그 추가
        if (optionalChatRequestDetails.isPresent()) {
            log.info("ChatRequestDetails found for Request ID: {}", requestId);
        } else {
            log.warn("No ChatRequestDetails found for Request ID: {}. It may not exist in the database.", requestId);
            throw new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND);
        }

        // ChatRequestDetails에서 recommendedLLM 필드를 가져오기
        ChatRequestDetails chatRequestDetails = optionalChatRequestDetails.get();
        log.info("Full ChatRequestDetails document for Request ID {}: {}", requestId, chatRequestDetails);

        List<Map<String, Object>> recommendedLLM = chatRequestDetails.getRecommendedLLM();

        // recommendedLLM 필드가 null 또는 empty인지 확인
        if (recommendedLLM == null || recommendedLLM.isEmpty()) {
            log.warn("Recommended LLM data is either null or empty for Request ID: {}", requestId);
            throw new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND);
        }

        log.info("Successfully fetched model recommendations for Request ID: {}. Number of recommendations: {}", requestId, recommendedLLM.size());
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
        return chatRequestDetailsRepository.findById(requestId)
            .map(ChatRequestDetails::getFileUrl)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND));
    }
}
