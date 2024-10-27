package com.ssafy.wada.common.error;

import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CommonErrorCode implements ErrorCode {
	UNKNOWN_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "알 수 없는 에러입니다.", LogLevel.ERROR),
	INVALID_PARAMETER_ERROR(HttpStatus.BAD_REQUEST, "잘못된 요청값입니다.", LogLevel.ERROR),;

	private final HttpStatus status;
	private final String message;
	private final LogLevel logLevel;

	@Override
	public String getCode() {
		return name();
	}
}
