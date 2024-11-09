package com.ssafy.wada.presentation.controller;

import com.ssafy.wada.application.service.ChatRecordService;
import com.ssafy.wada.common.annotation.SessionId;
import com.ssafy.wada.presentation.response.ChatHistoryDetailResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.ssafy.wada.application.dto.ChatHistoryResponse;

@Slf4j
@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class ChatRecordController {

    private final ChatRecordService chatRecordService;

    // 전체 대화 기록 조회
    @GetMapping(value = "/all", produces = "application/json")
    public ResponseEntity<List<ChatHistoryResponse>> getAllChatHistory(@SessionId String sessionId) {
        log.info("Fetching all chat history for sessionId: {}", sessionId);
        List<ChatHistoryResponse> allChatHistory = chatRecordService.getAllChatHistory(sessionId);
        return ResponseEntity.ok(allChatHistory);
    }

    // 특정 chatRoomId에 대한 대화 기록 조회
    @GetMapping(produces = "application/json")
    public ResponseEntity<List<ChatHistoryDetailResponse>> getChatHistoryByChatRoomId(
        @SessionId String sessionId,
        @RequestParam("chatRoomId") String chatRoomId) {

        log.info("Fetching chat history detail for sessionId: {} and chatRoomId: {}", sessionId, chatRoomId);
        List<ChatHistoryDetailResponse> chatHistory = chatRecordService.getChatHistoryDetail(sessionId, chatRoomId);
        return ResponseEntity.ok(chatHistory);
    }
}
