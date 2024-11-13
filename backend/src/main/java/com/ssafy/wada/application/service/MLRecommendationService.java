package com.ssafy.wada.application.service;

import static com.ssafy.wada.application.domain.util.AttachedFile.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.wada.application.domain.File;
import com.ssafy.wada.application.repository.FileRepository;
import com.ssafy.wada.client.openai.GptRequest.GptResultRequest;
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
	private final PromptGenerator promptGenerator;

	@Value("${openai.api.key}")
	private String apiKey;


	public String recommend(String sessionId, String chatRoomId, String analysisPurpose, List<MultipartFile> files) {

		log.info("Step 1: Start recommendation process");
		// Lazy 로딩 방식으로 Guest 조회 및 생성
		Guest guest = guestRepository.findById(sessionId)
			.orElseGet(() -> guestRepository.save(Guest.create(sessionId)));
		log.info("Step 1-1: Guest retrieved or created with sessionId={}", sessionId);
		String fileName = files.get(0).getOriginalFilename();
		ChatRoom chatRoom = chatRoomRepository.findByIdAndGuestId(chatRoomId, guest.getId())
			.orElseGet(() -> {
				log.info("ChatRoom with chatRoomId={} not found for guest with sessionId={}. Creating new ChatRoom.", chatRoomId, sessionId);
				return chatRoomRepository.save(ChatRoom.create(chatRoomId, guest));
			});
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
		int requestId = saveGptResponseToMongo(gptResponse, chatRoomId, fileUrls, analysisPurpose, requestToken, responseToken,inputDataList,fileName);
		log.info("Step 6: GPT response and file paths saved to MongoDB with requestId={}", requestId);

		return createResponse(gptResponse, requestId);
	}

	private int saveGptResponseToMongo(String gptResponse, String chatRoomId,
		List<String> fileUrls, String requirement, int requestToken,
		int responseToken, List<Map<String, Object>> inputDataList,String fileName) {
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
			analysisRequest.put("inputDataList", inputDataList);
			analysisRequest.put("fileName",fileName);

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

	/**
	 *
	 * @param chatRoomId
	 * @param requestId
	 * @return
	 * 선택된 모델 제외하고 새로 requestID 채번
	 * Step1 ChatRoomId와 RequestId로 조회
	 * Step2
	 */
	public Object mlRecommendationExceptChosenService(String chatRoomId, int requestId) {
		log.info("Step 1: Start fetching data for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 2: MongoDB에서 chatRoomId와 requestId로 데이터 조회
		Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId).and("requestId").is(requestId));
		Document chatRoomDataDoc = mongoTemplate.findOne(query, Document.class, "MongoDB");

		if (chatRoomDataDoc == null) {
			log.error("Step 2: Data not found for chatRoomId: {} and requestId: {}", chatRoomId, requestId);
			throw new BusinessException(SessionErrorCode.NOT_EXIST_SESSION_ID);
		}
		log.info("Step 2: Data found for chatRoomId: {}, requestId: {}", chatRoomId, requestId);
		Map<String, Object> chatRoomData = objectMapper.convertValue(chatRoomDataDoc, Map.class);

		// Step 3: 필요한 필드를 기존 데이터에서 추출 및 null 체크
		Object fileUrls = chatRoomData.getOrDefault("fileUrls", new ArrayList<>()); // 기본 빈 리스트
		Object createdTime = chatRoomData.getOrDefault("createdTime", LocalDateTime.now()); // 기본 현재 시간
		Object requirement = chatRoomData.getOrDefault("requirement", ""); // 기본 빈 문자열


		// Step 4: RecommendedModelFromLLM 필드가 있는지 확인하고 형식 검증
		Map<String, Object> recommendedModelFromLLMObj = (Map<String, Object>) chatRoomData.get("RecommendedModelFromLLM");
		Object purposeUnderstanding =  recommendedModelFromLLMObj.get("purpose_understanding");
		Object dataOverview = recommendedModelFromLLMObj.get("data_overview");


		// model_recommendations 필드를 List<Map<String, Object>> 형식으로 캐스팅
		List<Map<String, Object>> modelRecommendations = null;
		if (recommendedModelFromLLMObj != null && recommendedModelFromLLMObj.get("model_recommendations") instanceof List) {
			modelRecommendations = ((List<?>) recommendedModelFromLLMObj.get("model_recommendations")).stream()
				.filter(item -> item instanceof Map)
				.map(item -> (Map<String, Object>) item)
				.collect(Collectors.toList());
		} else {
			log.error("Step 4: model_recommendations field is missing or invalid in MongoDB data for chatRoomId: {} and requestId: {}", chatRoomId, requestId);
			throw new BusinessException(SessionErrorCode.NOT_EXIST_SESSION_ID);
		}
		log.info("Step 4: model_recommendations field is valid for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 5: model_recommendations 필드에서 isSelected가 true인 항목을 제외
		List<Map<String, Object>> filteredRecommendations = modelRecommendations.stream()
			.filter(model -> !Boolean.TRUE.equals(model.get("isSelected")))
			.collect(Collectors.toList());

		log.info("Step 5: Filtered model recommendations for chatRoomId: {}, requestId: {}. Total recommendations: {}", chatRoomId, requestId, filteredRecommendations.size());

		// Step 6: 새 requestId 생성 - chatRoomId로 조회된 객체 수 + 1
		Query countQuery = new Query(Criteria.where("chatRoomId").is(chatRoomId));
		long existingCount = mongoTemplate.count(countQuery, "MongoDB");
		int newRequestId = (int) existingCount + 1;
		log.info("Step 6: Generated new requestId: {}", newRequestId);

		// Step 7: 새로운 Document에 필드 저장
		Document newDocument = new Document();
		newDocument.put("chatRoomId", chatRoomId);
		newDocument.put("requestId", newRequestId);
		newDocument.put("createdTime", createdTime);
		newDocument.put("fileUrls", fileUrls);
		newDocument.put("requirement", requirement);
		newDocument.put("RecommendedModelFromLLM", Map.of(
			"purpose_understanding", purposeUnderstanding,
			"data_overview", dataOverview,
			"model_recommendations", filteredRecommendations
		));

		mongoTemplate.insert(newDocument, "MongoDB");
		log.info("Step 7: Saved filtered recommendations to MongoDB with new requestId: {}", newRequestId);

		// Step 8: 필요한 형식으로 응답 반환
		Map<String, Object> response = new HashMap<>();
		response.put("requestId", newRequestId);
		response.put("purpose_understanding", purposeUnderstanding);
		response.put("data_overview", dataOverview);
		response.put("model_recommendations", filteredRecommendations);

		return response;
	}

	public Object alternativeRecommend(String chatRoomId, int requestId, String newRequirement) {
		log.info("Step 1: Start alternative recommendation process for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 2: MongoDB에서 요청 문서 조회
		Query query = new Query();
		query.addCriteria(Criteria.where("chatRoomId").is(chatRoomId).and("requestId").is(requestId));
		Document chatRoomDataDoc = mongoTemplate.findOne(query, Document.class, "MongoDB");

		if (chatRoomDataDoc == null) {
			log.warn("Step 2: No data found for chatRoomId: {}, requestId: {}", chatRoomId, requestId);
			return "데이터를 찾을 수 없습니다.";
		}
		log.info("Step 2: Found MongoDB document for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 3: Document를 Map으로 변환
		Map<String, Object> chatRoomData = objectMapper.convertValue(chatRoomDataDoc, Map.class);
		log.info("Step 3: Converted MongoDB document to Map for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 4: 필요한 데이터 추출
		Object requirement = chatRoomData.get("requirement");
		List<String> fileUrls = (List<String>) chatRoomData.get("fileUrls");
		List<Map<String, Object>> inputDataList = (List<Map<String, Object>>) chatRoomData.get("inputDataList");
		String fileName = (String) chatRoomData.get("fileName");
		Object recommendedModelFromLLM = chatRoomData.get("RecommendedModelFromLLM");
		log.info("Step 4: Extracted requirement, fileUrls, inputDataList, and recommendedModelFromLLM for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 5: System Prompt 및 User Prompt 생성
		String systemPrompt = promptGenerator.createSystemPromptForAlternative(requirement, inputDataList, recommendedModelFromLLM);
		String userPrompt = promptGenerator.createUserPromptForAlternative(newRequirement);
		log.info("Step 5: Generated systemPrompt and userPrompt for alternative recommendation for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 6: GPT 요청
		GptResultRequest gptRequest = new GptResultRequest(systemPrompt, userPrompt);
		String gptResponse = gptClient.callFunctionWithResultRequest("Bearer " + apiKey, gptRequest);
		log.info("Step 6: Received GPT response for alternative recommendation for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

		// Step 7: MongoDB에 GPT 응답 저장
		int requestToken = calculateTokens(systemPrompt + userPrompt);
		int responseToken = calculateTokens(gptResponse);
		log.info("gptResponse: {}", gptResponse);

		int newRequestId = saveGptResponseToMongo(gptResponse, chatRoomId, fileUrls, newRequirement, requestToken, responseToken, inputDataList,fileName);
		log.info("Step 7: Saved GPT response to MongoDB with newRequestId: {} for chatRoomId: {}", newRequestId, chatRoomId);

		// Step 8: 응답 포맷팅
		String formattedResponse = createResponse(gptResponse, newRequestId);
		log.info("Step 8: Created formatted response for newRequestId: {}", newRequestId);

		return formattedResponse;
	}

}