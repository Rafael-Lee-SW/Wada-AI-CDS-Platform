package com.ssafy.wada.presentation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ssafy.wada.application.service.MLRecommendationService;
import com.ssafy.wada.common.annotation.SessionId;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequestMapping("/recommend")
@RestController
@RequiredArgsConstructor
public class MLModelRecommendController {

	private final MLRecommendationService mlRecommendationService;

	@PostMapping(produces = "application/json")
	public ResponseEntity<Object> getMLModelRecommend(
		@SessionId String sessionId,
		@RequestParam("file") MultipartFile file,
		@RequestParam("chatRoomId") String chatRoomId,
		@RequestParam("requirement") String requirement) {
		return ResponseEntity.ok(mlRecommendationService.recommend(sessionId, chatRoomId, requirement, file));
	}
}
