package com.ssafy.wada.presentation.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ssafy.wada.application.service.MLRecommendationService;
import com.ssafy.wada.presentation.response.MLRecommendResponse;

import lombok.RequiredArgsConstructor;

@RequestMapping("/recommend")
@RestController
@RequiredArgsConstructor
public class MLModelRecommendController {

	private final MLRecommendationService mlRecommendationService;

	@PostMapping
	public MLRecommendResponse getMLModelRecommend(
		@RequestParam("file") MultipartFile file,
		@RequestParam("chatId") String chatId) {
		return mlRecommendationService.recommend(file, chatId);
	}
}
