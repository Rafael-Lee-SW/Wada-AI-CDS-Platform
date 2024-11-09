package com.ssafy.wada.presentation.response;

import java.util.Map;

public record ModelDispatchResponse(
    int requestId,
    Map<String, Object> SelectedModelFromUser,
    Map<String, Object> ResultFromModel ,
    Map<String, Object> ResultDescriptionFromLLM
) {
    public static ModelDispatchResponse of(
        int requestId,
        Map<String, Object> SelectedModelFromUser,
        Map<String, Object> ResultFromModel,
        Map<String, Object> ResultDescriptionFromLLM

    ) {
        return new ModelDispatchResponse(requestId,SelectedModelFromUser, ResultFromModel,ResultDescriptionFromLLM);
    }
}
