package com.ssafy.wada.application.service;

import java.util.ArrayList;

import org.springframework.stereotype.Service;

import com.ssafy.wada.presentation.response.MLRecommendResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MLRecommendationService {

	private final ExcelParsingService excelParsingService;

	public MLRecommendResponse recommend() {
		excelParsingService.parse();

		return MLRecommendResponse.of(new ArrayList<>());
	}
}
