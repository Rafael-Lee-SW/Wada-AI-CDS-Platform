package com.ssafy.wada.application.service;

import static com.ssafy.wada.application.domain.util.AttachedFile.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.wada.application.domain.File;
import com.ssafy.wada.application.repository.FileRepository;
import com.ssafy.wada.client.openai.PromptGenerator;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.bson.Document; // MongoDB Document import
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.mongodb.core.query.Query;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.ssafy.wada.application.domain.ChatRoom;
import com.ssafy.wada.application.domain.util.CsvResult;
import com.ssafy.wada.application.domain.Guest;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.GuestRepository;
import com.ssafy.wada.client.openai.GptClient;
import com.ssafy.wada.client.openai.GptRequest;
import com.ssafy.wada.client.s3.S3Client;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.FileErrorCode;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MLRecommendationService {

	private static final int RANDOM_SELECT_ROWS = 20;

	private final CsvParsingService csvParsingService;
	private final GuestRepository guestRepository;
	private final ChatRoomRepository chatRoomRepository;
	private final FileRepository fileRepository;
	private final ObjectMapper objectMapper;
	private final GptClient gptClient;
	private final S3Client s3Client;
	private final MongoTemplate mongoTemplate;

	@Value("${openai.api.key}")
	private String apiKey;

	@Transactional
	public String recommend(String sessionId, String chatRoomId, String analysisPurpose, MultipartFile file) {
		log.info("Step 1: Start recommendation process");

		// Step 1-1: Guest 조회 또는 생성
		Guest guest = guestRepository.findById(sessionId)
			.orElseGet(() -> guestRepository.save(Guest.create(sessionId)));
		log.info("Step 1-1: Guest retrieved or created with sessionId={}", sessionId);

		// Step 1-2: ChatRoom 조회 또는 생성
		ChatRoom chatRoom = chatRoomRepository.findByIdAndGuestId(chatRoomId, guest.getId())
			.orElseGet(() -> chatRoomRepository.save(ChatRoom.create(chatRoomId, guest)));
		log.info("Step 1-2: ChatRoom retrieved or created with chatRoomId={}", chatRoomId);

		// Step 2: 파일 업로드 및 URL 저장
		log.info("Step 2: Uploading file to S3 and preparing for MongoDB save");
		String fileUrl = CompletableFuture.supplyAsync(() -> s3Client.upload(toAttachedFile(file))).join();
		File fileEntity = File.create(UUID.randomUUID().toString(), chatRoom, fileUrl);
		fileRepository.save(fileEntity);
		log.info("Step 2: File uploaded to S3 with URL={}", fileUrl);

		// Step 3: CSV 파일 파싱
		log.info("Step 3: Parsing CSV file");
		CsvResult csvResult = csvParsingService.parse(file);
		String[] headers = csvResult.headers();
		List<String[]> rows = csvResult.rows();
		List<String[]> randomRows = getRandomRows(rows, RANDOM_SELECT_ROWS);
		String jsonData = convertToJson(headers, randomRows);
		log.info("Step 3: Parsed CSV file with headers={} and random rows={}", Arrays.toString(headers), jsonData);

		// Step 4: Prompt 생성
		String header = "Bearer " + apiKey;
		Map<String, Object> modelParams = new HashMap<>();
		modelParams.put("columns", Arrays.toString(headers));
		modelParams.put("random_10_rows", jsonData);
		modelParams.put("analysisPurpose", analysisPurpose);
		String body = PromptGenerator.createRecommendedModelFromLLM(modelParams);
		log.info("Step 4: Generated prompt for GPT model");

		// Step 5: GPT 호출 및 응답 처리
		log.info("Step 5: Calling GPT model");
		GptRequest.Message message = GptRequest.Message.roleUserMessage(body);
		GptRequest request = new GptRequest(List.of(message));
		String gptResponse = gptClient.callFunction(header, request);
		log.info("Step 5: GPT model response received");

		int requestToken = calculateTokens(body); // body에 사용된 토큰 수 계산
		int responseToken = calculateTokens(gptResponse); // gptResponse에 사용된 토큰 수 계산

		// Step 6: GPT 응답과 파일 URL을 MongoDB에 저장
		int requestId = saveGptResponseToMongo(gptResponse, chatRoomId, fileUrl, analysisPurpose, requestToken, responseToken);
		log.info("Step 6: GPT response and file path saved to MongoDB with requestId={}", requestId);

		// 결과 반환
		return createResponse(gptResponse, requestId);
	}

	private int saveGptResponseToMongo(String gptResponse, String chatRoomId, String fileUrl, String requirement, int requestToken, int responseToken) {
		try {
			// GPT 응답의 content 추출
			JsonNode rootNode = objectMapper.readTree(gptResponse);
			JsonNode contentNode = rootNode.at("/choices/0/message/content");

			if (contentNode.isMissingNode()) {
				log.error("GPT response does not contain 'choices[0].message.content' field. Response: {}", gptResponse);
				throw new BusinessException(FileErrorCode.JSON_PROCESSING_ERROR);
			}

			// `contentNode`를 JSON으로 다시 파싱하여 `RecommendedModelFromLLM` 데이터 추출
			JsonNode parsedContent = objectMapper.readTree(contentNode.asText());
			JsonNode modelRecommendationsNode = parsedContent.get("model_recommendations");

			if (modelRecommendationsNode == null) {
				log.error("Parsed content does not contain 'model_recommendations' field. Content: {}", contentNode.asText());
				throw new BusinessException(FileErrorCode.JSON_PROCESSING_ERROR);
			}

			// 각 모델에 "isSelected": false 추가하고 전체 정보를 `RecommendedModelFromLLM`로 설정
			List<Map<String, Object>> modelRecommendations = new ArrayList<>();
			modelRecommendationsNode.forEach(model -> {
				Map<String, Object> modelMap = objectMapper.convertValue(model, Map.class);
				modelMap.put("isSelected", false);
				modelRecommendations.add(modelMap);
			});

			// `RecommendedModelFromLLM`에 추가 정보를 포함하도록 구성
			Map<String, Object> recommendedModelData = new HashMap<>();
			recommendedModelData.put("purpose_understanding", parsedContent.get("purpose_understanding"));
			recommendedModelData.put("data_overview", parsedContent.get("data_overview"));
			recommendedModelData.put("model_recommendations", modelRecommendations);

			// 전체 chatRoomId에 해당하는 요청 수를 계산하여 새로운 requestId 생성
			Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
			long requestCount = mongoTemplate.count(query, "MongoDB");
			int newRequestId = (int) requestCount + 1; // 새 requestId는 현재 요청 수 + 1로 설정

			// 기존 requestTokenUsage 및 responseTokenUsage가 있다면 가져와서 더함
			Document existingData = mongoTemplate.findOne(query, Document.class, "MongoDB");
			int existingRequestTokenUsage = existingData != null && existingData.getInteger("requestTokenUsage") != null
				? existingData.getInteger("requestTokenUsage") : 0;
			int existingResponseTokenUsage = existingData != null && existingData.getInteger("responseTokenUsage") != null
				? existingData.getInteger("responseTokenUsage") : 0;

			// 새로운 토큰 사용량 계산
			int totalRequestTokenUsage = existingRequestTokenUsage + requestToken;
			int totalResponseTokenUsage = existingResponseTokenUsage + responseToken;

			// 토큰 사용량에 따른 가격 계산
			double requestPricePerToken = 0.00006; // 요청 토큰당 가격
			double responsePricePerToken = 0.00012; // 응답 토큰당 가격
			double requestPrice = totalRequestTokenUsage * requestPricePerToken;
			double responsePrice = totalResponseTokenUsage * responsePricePerToken;
			double totalPrice = requestPrice + responsePrice;

			// MongoDB에 저장할 데이터 구성
			Map<String, Object> analysisRequest = new HashMap<>();
			analysisRequest.put("chatRoomId", chatRoomId);
			analysisRequest.put("requestId", newRequestId);
			analysisRequest.put("fileUrl", fileUrl);
			analysisRequest.put("requirement", requirement);
			analysisRequest.put("RecommendedModelFromLLM", recommendedModelData);
			analysisRequest.put("createdTime", LocalDateTime.now());
			analysisRequest.put("requestTokenUsage", totalRequestTokenUsage);
			analysisRequest.put("responseTokenUsage", totalResponseTokenUsage);
			analysisRequest.put("totalPrice", totalPrice);

			mongoTemplate.save(new Document(analysisRequest), "MongoDB");
			log.info("Saved data with chatRoomId: {} and requestId: {}", chatRoomId, newRequestId);

			return newRequestId;

		} catch (Exception e) {
			log.error("Error processing GPT response", e);
			throw new BusinessException(FileErrorCode.JSON_PROCESSING_ERROR);
		}
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
			throw new BusinessException(FileErrorCode.JSON_PROCESSING_ERROR);
		}
	}

	private String createResponse(String jsonResponse, int requestId) {
		log.info("jsonResponse " + jsonResponse);
		try {
			ObjectMapper mapper = new ObjectMapper();
			JsonNode rootNode = mapper.readTree(jsonResponse);
			String messageContent = rootNode.get("choices").get(0).get("message").get("content").asText();
			log.info("message: " + messageContent);
			JsonNode jsonNode = mapper.readTree(messageContent);

			((ObjectNode) jsonNode).put("requestId", requestId);

			ObjectWriter writer = mapper.writerWithDefaultPrettyPrinter();
			return writer.writeValueAsString(jsonNode);

		} catch (Exception e) {
			log.error("parse error");
			e.printStackTrace();
		}
		return null;
	}

	private int calculateTokens(String content) {
		return content.length() / 4; // 간단한 추정치로 1 토큰 ≈ 4자
	}
}
