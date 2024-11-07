package com.ssafy.wada.application.domain;

import java.util.List;

public record RecommendedLLM(
	String modelName,
	String modelChoice,
	String selectionReasoning,
	ImplementationRequest implementationRequest
) {
	public record ImplementationRequest(
		String modelChoice,
		List<String> featureColumns,
		String targetVariable,
		Integer numClusters,
		Integer epochs,
		Integer batchSize
	) {}
}
