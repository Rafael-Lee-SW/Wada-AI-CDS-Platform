//package com.ssafy.wada.presentation.controller;
//
//import com.ssafy.wada.application.service.ModelDispatchService;
//import com.ssafy.wada.presentation.request.ModelDispatchRequest;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import com.ssafy.wada.presentation.response.ModelDispatchResponse;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//
//@Slf4j
//@RestController
//@RequestMapping("/analyzeModel")
//@RequiredArgsConstructor
//public class MLModelDispatchController {
//
//    private final ModelDispatchService modelDispatchService;
//
//    @PostMapping
//    public ModelDispatchResponse dispatchModel(
//        @RequestBody ModelDispatchRequest request) {
//
//        log.info("Chat Room ID: {}", request.getChatRoomId());
//        log.info("Selected Model Index: {}", request.getSelectedModel());
//
//        return modelDispatchService.dispatchModel( request.getChatRoomId(), request.getSelectedModel());
//    }
//
//    @PostMapping("/test")
//    public ModelDispatchResponse testDispatchModel(@RequestBody ModelDispatchRequest request) {
//        log.info("Testing Chat Room ID: {}", request.getChatRoomId());
//        log.info("Testing Selected Model Index: {}", request.getSelectedModel());
//
//        return modelDispatchService.dispatchModel(request.getChatRoomId(), request.getSelectedModel());
//    }
//}
