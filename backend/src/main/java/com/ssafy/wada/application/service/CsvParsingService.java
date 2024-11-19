package com.ssafy.wada.application.service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.ssafy.wada.application.domain.util.CsvResult;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.FileErrorCode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CsvParsingService {

	public CsvResult parse(MultipartFile file) {
		String[] headers = null;
		List<String[]> filteredRows = new ArrayList<>();

		try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), Charset.forName("EUC-KR")))) {
			headers = reader.readNext();

			if (headers == null) {
				throw new BusinessException(FileErrorCode.INVALID_CSV_HEADER);
			}

			int rowIndex = 1; // 헤더 이후 첫 번째 행부터 시작
			String[] nextLine;
			while ((nextLine = reader.readNext()) != null) {
				// 행 데이터 정제 및 기본값 추가
				String[] sanitizedRow = sanitizeRow(nextLine);
				filteredRows.add(sanitizedRow); // 정제된 행을 추가
				rowIndex++;
			}

		} catch (IOException | CsvValidationException e) {
			throw new BusinessException(FileErrorCode.CSV_PARSING_ERROR);
		}

		if (filteredRows.isEmpty()) {
			throw new BusinessException(FileErrorCode.INVALID_CSV_DATA);
		}
		return CsvResult.of(headers, filteredRows);
	}

	/**
	 * 빈 값과 특수 문자를 처리하며 행을 정제합니다.
	 */
	private String[] sanitizeRow(String[] row) {
		return Arrays.stream(row)
			.map(this::sanitizeCell) // 각 셀을 정제
			.map(this::handleEmptyValue) // 빈 값을 기본값으로 대체
			.toArray(String[]::new);
	}

	/**
	 * 셀의 특수 문자 및 공백을 제거합니다.
	 */
	private String sanitizeCell(String cell) {
		if (cell == null) {
			return ""; // Null 셀은 빈 문자열로 대체
		}
		String sanitized = cell.replaceAll("[^a-zA-Z0-9가-힣\\s\\p{Punct}]", "").trim();
		if (!cell.equals(sanitized)) {
		}
		return sanitized;
	}

	/**
	 * 빈 값을 기본값("DEFAULT_VALUE")으로 대체합니다.
	 */
	private String handleEmptyValue(String cell) {
		if (cell == null || cell.trim().isEmpty()) {
			return "DEFAULT_VALUE";
		}
		return cell;
	}
}
