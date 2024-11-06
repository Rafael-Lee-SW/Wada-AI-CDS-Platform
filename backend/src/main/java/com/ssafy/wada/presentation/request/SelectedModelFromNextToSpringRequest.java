package com.ssafy.wada.presentation.request;

import lombok.Data;

@Data
public class SelectedModelFromNextToSpringRequest {
    private String chatRoomId; //UUID v4
    private Object selectedModel;
}
