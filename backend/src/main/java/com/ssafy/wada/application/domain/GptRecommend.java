package com.ssafy.wada.application.domain;

import java.util.List;

public record GptRecommend(
	MLModel mlModel, List<String> columns, String description
) {
}
