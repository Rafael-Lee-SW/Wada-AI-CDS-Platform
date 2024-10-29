package com.ssafy.wada.application.domain;

import java.util.List;

public record CsvResult(String[] headers, List<String[]> rows) {
	public static CsvResult of(String[] headers, List<String[]> rows) {
		return new CsvResult(headers, rows);
	}
}
