package com.ssafy.wada.presentation.controller;

import java.util.List;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
		@RequestParam("files") List<MultipartFile> files,
		@RequestParam("chatRoomId") String chatRoomId,
		@RequestParam("requirement") String requirement) {
		return ResponseEntity.ok(mlRecommendationService.recommend(sessionId, chatRoomId, requirement, files));
	}

	@PostMapping(value="again" , produces = "application/json")
	public ResponseEntity<Object> postMLModelRecommend(
		@RequestBody Map<String, Object> payload
	) {
		String chatRoomId = (String) payload.get("chatRoomId");
		int requestId = (int) payload.get("requestId");

		return ResponseEntity.ok(mlRecommendationService.mlRecommendationExceptChosenService(chatRoomId, requestId));
	}



	@PostMapping(value = "/alternative", produces = "application/json")
	public ResponseEntity<Object> getMLModelRecommend(
		@RequestBody Map<String, Object> payload
	) {
		String chatRoomId = (String) payload.get("chatRoomId");
		int requestId = (int) payload.get("requestId");
		String newRequirement = (String) payload.get("newRequirement");
		return ResponseEntity.ok(mlRecommendationService.alternativeRecommend(chatRoomId, requestId, newRequirement));
	}
}
