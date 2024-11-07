package com.ssafy.wada.presentation.controller;

import com.ssafy.wada.application.service.ModelDispatchService;
import com.ssafy.wada.presentation.request.SelectedModelFromNextToSpringRequest;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/analyze-model")
@RequiredArgsConstructor
public class SelectedModelDispatchController {

    private final ModelDispatchService modelDispatchService;

    @PostMapping
    public ModelDispatchResponse analyzeModel(@RequestBody SelectedModelFromNextToSpringRequest request) {
        String chatRoomId = request.getChatRoomId();  // chatRoomId 추출
        Object selectedModel = request.getSelectedModel();  // selectedModel 추출

        if (chatRoomId == null) {
            throw new IllegalArgumentException("chatRoomId가 누락되었습니다.");
        }

        log.info("chatRoomId: {}", chatRoomId);

        // ModelDispatchService에 chatRoomId와 selectedModel 전달
        return modelDispatchService.dispatchModel(chatRoomId, selectedModel);
    }
}
