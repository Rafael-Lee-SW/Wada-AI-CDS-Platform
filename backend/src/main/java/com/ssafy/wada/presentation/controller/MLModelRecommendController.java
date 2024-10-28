package com.ssafy.wada.presentation.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.wada.application.service.MLRecommendationService;
import com.ssafy.wada.presentation.response.MLRecommendResponse;

import lombok.RequiredArgsConstructor;

@RequestMapping("/recommend")
@RestController
@RequiredArgsConstructor
public class MLModelRecommendController {

	private final MLRecommendationService mlRecommendationService;

	@PostMapping
	public MLRecommendResponse getMLModelRecommend() {
		return mlRecommendationService.recommend();
	}
}
