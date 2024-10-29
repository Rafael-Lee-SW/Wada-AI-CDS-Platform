package com.ssafy.wada.common.error;

import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
	private final HttpStatus status;
	private final String code;
	private final LogLevel logLevel;

	public BusinessException(ErrorCode errorCode) {
		super(errorCode.getMessage());
		this.status = errorCode.getStatus();
		this.code = errorCode.getCode();
		this.logLevel = errorCode.getLogLevel();
	}
}
