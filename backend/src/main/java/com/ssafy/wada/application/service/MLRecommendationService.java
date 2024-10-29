package com.ssafy.wada.application.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.wada.application.domain.ChatRoom;
import com.ssafy.wada.application.domain.CsvResult;
import com.ssafy.wada.application.domain.Guest;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.GuestRepository;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.CsvParsingErrorCode;
import com.ssafy.wada.presentation.response.MLRecommendResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MLRecommendationService {

	private static final int RANDOM_SELECT_ROWS = 20;

	private final CsvParsingService csvParsingService;
	private final GuestRepository guestRepository;
	private final ChatRoomRepository chatRoomRepository;
	private final ObjectMapper objectMapper;

	public MLRecommendResponse recommend(String sessionId, String chatRoomId, MultipartFile file) {
		Guest guest = guestRepository.findById(sessionId)
			.orElseGet(() -> guestRepository.save(Guest.create(sessionId)));

		ChatRoom chatRoom = chatRoomRepository.findByIdAndGuestId(chatRoomId, guest.getId())
			.orElseGet(() -> chatRoomRepository.save(ChatRoom.create(chatRoomId, guest.getId())));

		CsvResult csvResult = csvParsingService.parse(file);
		String[] headers = csvResult.headers();
		List<String[]> rows = csvResult.rows();
		List<String[]> randomRows = getRandomRows(rows, RANDOM_SELECT_ROWS);
		String jsonData = convertToJson(headers, randomRows);
		return MLRecommendResponse.of(new ArrayList<>());
	}

	private List<String[]> getRandomRows(List<String[]> rows, int n) {
		Collections.shuffle(rows);
		return rows.stream().limit(n).collect(Collectors.toList());
	}

	private String convertToJson(String[] headers, List<String[]> rows) {
		try {
			List<Map<String, String>> result = new ArrayList<>();

			for (String[] row : rows) {
				Map<String, String> rowMap = new HashMap<>();
				for (int i = 0; i < headers.length; i++) {
					rowMap.put(headers[i], row[i]);
				}
				result.add(rowMap);
			}
			return objectMapper.writeValueAsString(result);
		} catch (JsonProcessingException e) {
			throw new BusinessException(CsvParsingErrorCode.JSON_PROCESSING_ERROR);
		}
	}
}
