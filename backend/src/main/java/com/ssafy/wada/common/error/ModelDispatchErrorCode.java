package com.ssafy.wada.common.error;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ModelDispatchErrorCode implements ErrorCode {
    CHATROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "ChatRoom ID에 해당하는 requestId가 존재하지 않습니다.", LogLevel.WARN),
    MODEL_PARAMETER_NOT_FOUND(HttpStatus.NOT_FOUND, "ModelParameter가 존재하지 않습니다.", LogLevel.WARN);

    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;

    @Override
    public String getCode() {
        return name();
    }
}
