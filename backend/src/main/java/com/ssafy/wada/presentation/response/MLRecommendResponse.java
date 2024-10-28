package com.ssafy.wada.presentation.response;

import java.util.List;

public record MLRecommendResponse(List<ModelResponse> mlModels) {
	public static MLRecommendResponse of(List<ModelResponse> mlModels) {
		return new MLRecommendResponse(mlModels);
	}
}
