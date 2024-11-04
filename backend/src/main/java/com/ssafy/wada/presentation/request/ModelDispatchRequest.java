package com.ssafy.wada.presentation.request;

import lombok.Data;

@Data
public class ModelDispatchRequest  {
    private String chatRoomId; //UUID v4
    private int selectedModel;
}
