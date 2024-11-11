package com.ssafy.wada.application.service;

import static com.ssafy.wada.application.domain.util.AttachedFile.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.wada.application.domain.File;
import com.ssafy.wada.application.repository.FileRepository;
import com.ssafy.wada.client.openai.PromptGenerator;
import com.ssafy.wada.common.error.SessionErrorCode;
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


	public String recommend(String sessionId, String chatRoomId, String analysisPurpose, List<MultipartFile> files) {
		log.info("Step 1: Start recommendation process");

		// Step 1-1: Guest 조회 또는 생성
		Guest guest = guestRepository.findById(sessionId)
			.orElseGet(() -> guestRepository.save(Guest.create(sessionId)));
		log.info("Step 1-1: Guest retrieved or created with sessionId={}", sessionId);

		// Step 1-2: ChatRoom 조회 또는 생성
		ChatRoom chatRoom = chatRoomRepository.findByIdAndGuestId(chatRoomId, guest.getId())
			.orElseGet(() -> chatRoomRepository.save(ChatRoom.create(chatRoomId, guest)));
		log.info("Step 1-2: ChatRoom retrieved or created with chatRoomId={}", chatRoomId);

		List<Map<String, Object>> inputDataList = new ArrayList<>();
		List<String> fileUrls = new ArrayList<>(); // 파일 URL 저장 리스트

		// Step 3: CSV 파일 파싱 및 S3 업로드
		log.info("Step 3: Parsing CSV file and uploading to S3");
		List<CompletableFuture<Void>> futures = files.stream().map(file ->
			CompletableFuture.runAsync(() -> {
				try {
					CsvResult csvResult = csvParsingService.parse(file);
					String[] headers = csvResult.headers();
					List<String[]> rows = csvResult.rows();
					List<String[]> randomRows = getRandomRows(rows, RANDOM_SELECT_ROWS);
					String jsonData = convertToJson(headers, randomRows);
					log.info("Step 3: Parsed CSV file with headers={} and random rows={}", Arrays.toString(headers), jsonData);

					// Step 2: 파일 업로드 및 URL 저장
					log.info("Step 2: Uploading file to S3");
					String fileUrl = s3Client.upload(toAttachedFile(file));
					synchronized (fileUrls) {
						fileUrls.add(fileUrl); // 업로드된 파일 URL 추가
					}
					File fileEntity = File.create(UUID.randomUUID().toString(), chatRoom, fileUrl);
					fileRepository.save(fileEntity);
					log.info("Step 2: File uploaded to S3 with URL={}", fileUrl);

					// Step 4: Prompt 생성
					Map<String, Object> modelParams = new HashMap<>();
					modelParams.put("fileName", file.getOriginalFilename());
					modelParams.put("columns", Arrays.asList(headers));
					modelParams.put("random_10_rows", jsonData);
					synchronized (inputDataList) {
						inputDataList.add(modelParams);
					}
					log.info("Step 4: Generated prompt for GPT model");
				} catch (Exception e) {
					log.error("Error processing file: {}", file.getOriginalFilename(), e);
				}
			})
		).toList();

		// 모든 파일의 병렬 처리 완료 후 결과 대기
		CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

		// Step 5: GPT 호출 및 응답 처리
		log.info("Step 5: Calling GPT model");
		String header = "Bearer " + apiKey;
		String body = PromptGenerator.createRecommendedModelFromLLM(inputDataList, analysisPurpose);
		GptRequest.Message message = GptRequest.Message.roleUserMessage(body);
		GptRequest request = new GptRequest(List.of(message));
		String gptResponse = gptClient.callFunction(header, request);
		log.info("Step 5: GPT model response received");

		int requestToken = calculateTokens(body);
		int responseToken = calculateTokens(gptResponse);

		// Step 6: MongoDB에 GPT 응답 및 파일 URL 리스트 저장
		int requestId = saveGptResponseToMongo(gptResponse, chatRoomId, fileUrls, analysisPurpose, requestToken, responseToken);
		log.info("Step 6: GPT response and file paths saved to MongoDB with requestId={}", requestId);

		return createResponse(gptResponse, requestId);
	}

	private int saveGptResponseToMongo(String gptResponse, String chatRoomId, List<String> fileUrls, String requirement, int requestToken, int responseToken) {
		try {
			// GPT 응답의 content 추출 및 Map으로 변환
			JsonNode rootNode = objectMapper.readTree(gptResponse);
			JsonNode contentNode = rootNode.at("/choices/0/message/content");

			if (contentNode.isMissingNode()) {
				log.error("GPT response does not contain 'choices[0].message.content' field. Response: {}", gptResponse);
				throw new BusinessException(FileErrorCode.JSON_PROCESSING_ERROR);
			}

			Map<String, Object> parsedContent = objectMapper.readValue(contentNode.asText(), Map.class);
			List<Map<String, Object>> modelRecommendations = (List<Map<String, Object>>) parsedContent.get("model_recommendations");
			if (modelRecommendations == null) {
				log.error("Parsed content does not contain 'model_recommendations' field. Content: {}", contentNode.asText());
				throw new BusinessException(FileErrorCode.JSON_PROCESSING_ERROR);
			}
			modelRecommendations.forEach(model -> model.put("isSelected", false));

			Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
			long requestCount = mongoTemplate.count(query, "MongoDB");
			int newRequestId = (int) requestCount + 1;

			Document existingData = mongoTemplate.findOne(query, Document.class, "MongoDB");
			int totalRequestTokenUsage = (existingData != null ? existingData.getInteger("requestTokenUsage", 0) : 0) + requestToken;
			int totalResponseTokenUsage = (existingData != null ? existingData.getInteger("responseTokenUsage", 0) : 0) + responseToken;
			double totalPrice = (totalRequestTokenUsage * 0.00006) + (totalResponseTokenUsage * 0.00012);

			Map<String, Object> analysisRequest = new HashMap<>();
			analysisRequest.put("chatRoomId", chatRoomId);
			analysisRequest.put("requestId", newRequestId);
			analysisRequest.put("requirement", requirement);
			analysisRequest.put("fileUrls", fileUrls);  // 파일 URL 리스트 추가
			analysisRequest.put("RecommendedModelFromLLM", parsedContent);
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

	public Object mlRecommendationExceptChosenService(String chatRoomId, int requestId) {
		log.info("Fetching data for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId).and("requestId").is(requestId));
		Document document = mongoTemplate.findOne(query, Document.class, "MongoDB");

		if (document == null) {
			log.error("Data not found for chatRoomId: {} and requestId: {}", chatRoomId, requestId);
			throw new BusinessException(SessionErrorCode.NOT_EXIST_SESSION_ID);
		}

		// RecommendedModelFromLLM 필드가 있는지 확인하고, 가져온 데이터가 Document 형식인지 확인
		Object recommendedModelFromLLMObj = document.get("RecommendedModelFromLLM");
		if (!(recommendedModelFromLLMObj instanceof Document)) {
			log.error("RecommendedModelFromLLM field is missing or invalid in MongoDB data for chatRoomId: {} and requestId: {}", chatRoomId, requestId);
			throw new BusinessException(SessionErrorCode.NOT_EXIST_SESSION_ID);
		}

		Document recommendedModelFromLLM = (Document) recommendedModelFromLLMObj;
		List<Map<String, Object>> modelRecommendations;

		try {
			modelRecommendations = (List<Map<String, Object>>) recommendedModelFromLLM.get("model_recommendations");
		} catch (ClassCastException e) {
			log.error("model_recommendations is not in expected format in RecommendedModelFromLLM for chatRoomId: {} and requestId: {}", chatRoomId, requestId);
			throw new BusinessException(SessionErrorCode.NOT_EXIST_SESSION_ID);
		}

		// isSelected가 true인 항목 제외 후 반환
		return modelRecommendations.stream()
			.filter(model -> !(Boolean.TRUE.equals(model.get("isSelected"))))
			.collect(Collectors.toList());
	}
}