package com.ssafy.wada.presentation.controller;

import com.ssafy.wada.application.service.ModelDispatchService;
import com.ssafy.wada.presentation.request.SelectedModelFromNextToSpringRequest;
import com.ssafy.wada.presentation.response.ModelConversationResponse;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/analyzeModel")
@RequiredArgsConstructor
public class SelectedModelDispatchController {

    private final ModelDispatchService modelDispatchService;

    @PostMapping
    public ModelDispatchResponse analyzeModel(@RequestBody SelectedModelFromNextToSpringRequest request) {
        String chatRoomId = request.getChatRoomId();  // chatRoomId 추출
        int requestId = request.getRequestId();
        int selectedModel = request.getSelectedModel();  // selectedModel 추출


        // ModelDispatchService에 chatRoomId와 selectedModel 전달
        return modelDispatchService.dispatchModel(chatRoomId,requestId, selectedModel);
    }

    @PostMapping("/conversation")
    public ModelConversationResponse handleConversation(@RequestBody Map<String, Object> request){
        String chatRoomId = (String) request.get("chatRoomId");
        int requestId = (Integer) request.get("requestId");
        String text = (String) request.get("text");
// ModelDispatchService의 Conversation 메서드 호출
        String answer = modelDispatchService.conversation(chatRoomId, requestId, text);

        // 응답 데이터 생성 및 반환
        return new ModelConversationResponse(requestId, answer, LocalDateTime.now());

    }
}
