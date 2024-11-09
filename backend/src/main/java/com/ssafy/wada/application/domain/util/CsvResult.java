package com.ssafy.wada.application.domain.util;

import java.util.List;

public record CsvResult(String[] headers, List<String[]> rows) {
	public static CsvResult of(String[] headers, List<String[]> rows) {
		return new CsvResult(headers, rows);
	}
}
