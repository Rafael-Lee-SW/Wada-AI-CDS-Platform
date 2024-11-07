package com.ssafy.wada.common.error;

import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;

public interface ErrorCode {
	HttpStatus getStatus();

	String getMessage();

	String getCode();

	LogLevel getLogLevel();
}
