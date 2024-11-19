package com.ssafy.wada.common.error;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
		switch (e.getLogLevel()) {
			case INFO -> log.info("BusinessException occurred, message={}, className={}", e.getMessage(), e.getClass().getName());
			case WARN -> log.warn("BusinessException occurred, message={}, className={}", e.getMessage(), e.getClass().getName());
			case ERROR -> log.error("BusinessException occurred, message={}, className={}", e.getMessage(), e.getClass().getName());
		}
		return ResponseEntity.status(e.getStatus())
			.body(ErrorResponse.of(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleException(Exception e) {
		log.error("Exception occurred, message={}, className={}", e.getMessage(), e.getClass().getName());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(ErrorResponse.of(CommonErrorCode.UNKNOWN_ERROR));
	}

	@ExceptionHandler(BindException.class)
	public ResponseEntity<ErrorResponse> handleBindException(BindException e) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of(CommonErrorCode.INVALID_PARAMETER_ERROR, createBindMessage(e)));
	}

	private String createBindMessage(BindException e) {
		if(e.getFieldError() != null && e.getFieldError().getDefaultMessage() != null) {
			return e.getFieldError().getDefaultMessage();
		}
		return e.getFieldErrors().stream()
			.map(FieldError::getField)
			.collect(Collectors.joining(", ")) + " 값들이 정확하지 않습니다.";
	}
}
