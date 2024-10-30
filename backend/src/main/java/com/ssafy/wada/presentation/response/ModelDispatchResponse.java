package com.ssafy.wada.presentation.response;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class ModelDispatchResponse {
    private Map<String, Object> resultSummary; // 최종 결과 요약
    private Map<String, Object> resultAll; // 최종 결과 All
    private String resultLlmDescription; // 최종 llm 설명
}