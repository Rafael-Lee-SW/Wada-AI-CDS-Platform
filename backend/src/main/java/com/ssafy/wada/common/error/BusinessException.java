package com.ssafy.wada.common.error;

import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
	private final HttpStatus status;
	private final String code;
	private final String message;
	private final LogLevel logLevel;

	public BusinessException(ErrorCode errorCode) {
		this.status = errorCode.getStatus();
		this.code = errorCode.getCode();
		this.message = errorCode.getMessage();
		this.logLevel = errorCode.getLogLevel();
	}
}
