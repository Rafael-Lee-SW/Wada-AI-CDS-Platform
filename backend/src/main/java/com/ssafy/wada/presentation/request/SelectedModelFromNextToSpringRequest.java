package com.ssafy.wada.presentation.request;

import java.util.Map;
import lombok.Data;

@Data
public class SelectedModelFromNextToSpringRequest {
    private String chatRoomId; //UUID v4
    private int requestId;
    private int selectedModel;
        ;
}
