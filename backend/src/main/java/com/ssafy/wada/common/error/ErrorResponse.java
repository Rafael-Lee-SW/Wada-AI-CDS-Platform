package com.ssafy.wada.common.error;


public record ErrorResponse(String code, String message) {
	public static ErrorResponse of(String code, String message) {
		return new ErrorResponse(code, message);
	}

	public static ErrorResponse of(ErrorCode errorCode) {
		return new ErrorResponse(errorCode.getCode(), errorCode.getMessage());
	}

	public static ErrorResponse of(ErrorCode errorCode, String message) {
		return new ErrorResponse(errorCode.getCode(), message);
	}
}
