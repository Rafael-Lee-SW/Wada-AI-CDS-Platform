package com.ssafy.wada.common.error;

import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CsvParsingErrorCode implements ErrorCode {

	CSV_PARSING_ERROR(HttpStatus.BAD_REQUEST, "CSV파일을 읽는데 실패했습니다.", LogLevel.INFO),
	JSON_PROCESSING_ERROR(HttpStatus.BAD_REQUEST, "JSON 변환 중 오류가 발생했습니다.", LogLevel.WARN),
	INVALID_CSV_DATA(HttpStatus.BAD_REQUEST, "CSV파일에 유효하지 않은 값이 포함되어 있습니다.", LogLevel.INFO),
	INVALID_CSV_HEADER(HttpStatus.BAD_REQUEST, "CSV파일 헤더가 유효하지 않습니다.", LogLevel.INFO);

	private final HttpStatus status;
	private final String message;
	private final LogLevel logLevel;

	@Override
	public String getCode() {
		return name();
	}
}
