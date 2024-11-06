package com.ssafy.wada.application.service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.ssafy.wada.application.domain.CsvResult;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.FileErrorCode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CsvParsingService {

	public CsvResult parse(MultipartFile file) {
		String[] headers = null;
		List<String[]> filteredRows = new ArrayList<>();

		try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
			headers = reader.readNext();

			if (headers == null) {
				throw new BusinessException(FileErrorCode.INVALID_CSV_HEADER);
			}

			String[] nextLine;
			while ((nextLine = reader.readNext()) != null) {
				if (isValidRow(nextLine)) {
					filteredRows.add(nextLine);  // 유효한 행만 추가
				}
			}

		} catch (IOException | CsvValidationException e) {
			log.warn("CsvException occurred {} ", e.getMessage());
			throw new BusinessException(FileErrorCode.CSV_PARSING_ERROR);
		}

		if (filteredRows.isEmpty()) {
			throw new BusinessException(FileErrorCode.INVALID_CSV_DATA);
		}
		return CsvResult.of(headers, filteredRows);
	}

	private boolean isValidRow(String[] row) {
		return Arrays.stream(row).noneMatch(cell -> cell == null || cell.trim().isEmpty());
	}
}
