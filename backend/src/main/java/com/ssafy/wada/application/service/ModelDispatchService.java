package com.ssafy.wada.application.service;

import com.ssafy.wada.presentation.response.ModelDispatchResponse;

public interface ModelDispatchService {
    ModelDispatchResponse dispatchModel( String chatRoomId, int selectedModel);

}
