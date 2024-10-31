package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.ChatRoom;
import com.ssafy.wada.application.domain.ChatRequestDetails;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.ChatRequestDetailsRepository;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.ModelDispatchErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ChatRequestDetailsManager {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRequestDetailsRepository chatRequestDetailsRepository;

    public String getLatestMongoIdByChatRoomId(String chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
            .map(ChatRoom::getRequestId)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.CHATROOM_NOT_FOUND));
    }

    public ChatRequestDetails getChatRequestDetails(String mongoId) {
        return chatRequestDetailsRepository.findById(mongoId)
            .orElseThrow(() -> new BusinessException(ModelDispatchErrorCode.MODEL_PARAMETER_NOT_FOUND));
    }

    public void updateChatRequestDetails(String mongoId, Map<String, Object> resultSummary,
        Map<String, Object> resultAll, Map<String, Object> resultLlmDescription) {
        ChatRequestDetails chatRequestDetails = getChatRequestDetails(mongoId);

        chatRequestDetails.updateResults(resultSummary, resultAll, resultLlmDescription);
        chatRequestDetailsRepository.save(chatRequestDetails);
    }
}
