package com.ssafy.wada.presentation.response;

import java.util.Map;

public record ModelDispatchResponse(
    Map<String, Object> SelectedModelFromUser,
    Map<String, Object> ResultFromModel ,
    Map<String, Object> ResultDescriptionFromLLM
) {
    public static ModelDispatchResponse of(
        Map<String, Object> SelectedModelFromUser,
        Map<String, Object> ResultFromModel,
        Map<String, Object> ResultDescriptionFromLLM

    ) {
        return new ModelDispatchResponse(SelectedModelFromUser, ResultFromModel,ResultDescriptionFromLLM);
    }
}
