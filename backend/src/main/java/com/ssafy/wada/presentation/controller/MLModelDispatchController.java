package com.ssafy.wada.presentation.controller;

import com.ssafy.wada.application.service.ModelDispatchService;
import com.ssafy.wada.presentation.request.SelectedModelFromNextToSpringRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/analyze-model")
@RequiredArgsConstructor
public class MLModelDispatchController {

    private final ModelDispatchService modelDispatchService;

    @PostMapping
    public ModelDispatchResponse analyzeModel(@RequestBody SelectedModelFromNextToSpringRequest request) {
        String chatRoomId = request.getChatRoomId();
        Object selectedModel = request.getSelectedModel();


        log.info("Received chatRoomId: {}", chatRoomId);
        log.info("Received selectedModel: {}", selectedModel);


        return modelDispatchService.dispatchModel(chatRoomId, selectedModel);
    }
}
