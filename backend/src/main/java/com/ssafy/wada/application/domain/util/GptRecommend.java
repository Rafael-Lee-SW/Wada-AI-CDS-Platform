package com.ssafy.wada.application.domain.util;

import java.util.List;

public record GptRecommend(
	MLModel mlModel, List<String> columns, String description
) {
}
