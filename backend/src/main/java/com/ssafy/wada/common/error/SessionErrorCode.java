package com.ssafy.wada.common.error;

import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SessionErrorCode implements ErrorCode {
	NOT_EXIST_SESSION_ID(HttpStatus.BAD_REQUEST, "헤더에 SESSION ID가 존재하지 않습니다.", LogLevel.INFO);

	private final HttpStatus status;
	private final String message;
	private final LogLevel logLevel;

	@Override
	public String getCode() {
		return name();
	}

}
