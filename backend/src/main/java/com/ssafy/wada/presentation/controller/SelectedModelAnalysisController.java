package com.ssafy.wada.presentation.controller;

import com.ssafy.wada.application.service.ModelDispatchService;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/analyzeModel")
@RequiredArgsConstructor
public class SelectedModelAnalysisController {

    private final ModelDispatchService modelDispatchService;

    @PostMapping
    public ModelDispatchResponse analyzeModel(@RequestBody Map<String, Object> request) {
        String chatRoomId = (String) request.remove("chatRoomId"); // chatRoomId 제거
        if (chatRoomId == null) {
            throw new IllegalArgumentException("chatRoomId가 누락되었습니다.");
        }

        log.info("chatRoomId: {}", chatRoomId);

        // 남은 데이터를 그대로 전달
        return modelDispatchService.dispatchModel(chatRoomId, request);
    }
}
