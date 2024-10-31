package com.ssafy.wada.presentation.response;

import java.util.Map;

public record ModelDispatchResponse(
    Map<String, Object> resultSummary,
    Map<String, Object> resultAll,
    Map<String, Object> resultLlmDescription  // String -> Map<String, Object> 로 변경
) {
    public static ModelDispatchResponse of(
        Map<String, Object> resultSummary,
        Map<String, Object> resultAll,
        Map<String, Object> resultLlmDescription
    ) {
        return new ModelDispatchResponse(resultSummary, resultAll, resultLlmDescription);
    }
}
