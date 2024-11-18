package com.ssafy.wada.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.client.openai.GptClient;
import com.ssafy.wada.client.openai.GptRequest.GptResultRequest;
import com.ssafy.wada.client.openai.GptResponseParser;
import com.ssafy.wada.client.openai.PromptGenerator;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.bson.Document;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModelDispatchService {

    private final MongoTemplate mongoTemplate;
    private final ChatRoomRepository chatRoomRepository;
    private final FastApiService fastApiService;
    private final PromptGenerator promptGenerator;
    private final GptClient gptClient;
    private final GptResponseParser gptResponseParser;
    private final ObjectMapper objectMapper;
    private final ConvertToSelectedService convertToSelectedService;

    @Value("${openai.api.key}")
    private String apiKey;

    public ModelDispatchResponse dispatchModel(String chatRoomId, int requestId, int selectedModelIndex) {

        // Step1 MongoQuery 객체 가져오기
        log.info("Step 1: MongoDB에서 chatRoomData 가져오기");
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId).and("requestId").is(requestId));
        Document chatRoomDataDoc = mongoTemplate.findOne(query, Document.class, "MongoDB");

        if (chatRoomDataDoc == null) {
            throw new IllegalArgumentException("No data found for chatRoomId: " + chatRoomId + " and requestId: " + requestId);
        }

        // Step2 Document 데이터를 Map<String, Object>로 변환합니다.
        Map<String, Object> chatRoomData = objectMapper.convertValue(chatRoomDataDoc, Map.class);
        log.info("Step2 Document 데이터 Map 변환 chatRoomData: {}", chatRoomData);

        // Step3 Mongo객체에서 fileUrls List 추출후 0번 인덱스
        List<String> fileUrlList = (List<String>) chatRoomData.get("fileUrls");
        String fileUrl = null;
        if (fileUrlList != null && !fileUrlList.isEmpty()) {
            fileUrl = fileUrlList.get(0); // 첫 번째 URL을 추출
            log.info("Step3 Document 데이터에서 File Url 꺼내기 fileUrl: {}",fileUrl);
        } else {
            throw new IllegalArgumentException("fileUrl not found for chatRoomId: " + chatRoomId + " and requestId: " + requestId);
        } log.info("step3 Document 데이터에서 fileUrl 인덱스 0번 추출: {}", fileUrl);

        Map<String, Object> recommendedModelFromLLM = (Map<String, Object>) chatRoomData.get("RecommendedModelFromLLM");
        Map<String, Object> updatedRecommendedModelFromLLM = convertToSelectedService.ConvertRecommendedModelFromLLM(recommendedModelFromLLM, selectedModelIndex);

        // step4 선택된 모델 추출 선택된 모델 isSelected없애기
        List<Map<String, Object>> recommendedModels = getRecommendedModels(chatRoomData, chatRoomId, requestId);
        Map<String, Object> selectedModel = selectModelByIndex(recommendedModels, selectedModelIndex);
        log.info("Step 4  IsSelected true로 변경, 인덱스로 selectedModel 추출 , 빈값 null로 삽입  selectedModel: {}", selectedModel);
        log.info("Step 4 true 변경 반영 확인 recommendedModels: {}", recommendedModels);

        // 모델 상세 정보를 FastAPI로 전달
        log.info("Step 5 FastAPI 전달");
        Map<String, Object> analysisResult = fastApiService.sendToFastApi(fileUrl, selectedModel);
        Map<String, Object> fastApiResult = (Map<String, Object>) analysisResult.get("result");

        // GPT Api 호출 결과받기 (SystemPrompt UserPrompt)
        Map<String, Object> gptResultResponse = getGptResponse(selectedModel, fastApiResult);

        // MongoDB에 최종 데이터 저장
        saveToMongoDB(query, updatedRecommendedModelFromLLM, selectedModel, fastApiResult, gptResultResponse, chatRoomId);

        // 결과 반환
        return ModelDispatchResponse.of(requestId, selectedModel, fastApiResult, gptResultResponse);
    }

    private List<Map<String, Object>> getRecommendedModels(Map<String, Object> chatRoomData, String chatRoomId, int requestId) {
        // RecommendedModelFromLLM 확인
        JsonNode recommendedModelData = objectMapper.convertValue(chatRoomData.get("RecommendedModelFromLLM"), JsonNode.class);
        if (recommendedModelData == null || !recommendedModelData.has("model_recommendations")) {
            throw new IllegalArgumentException("RecommendedModelFromLLM or model_recommendations not found for chatRoomId: " + chatRoomId + " and requestId: " + requestId);
        }

        ArrayNode modelRecommendationsNode = (ArrayNode) recommendedModelData.get("model_recommendations");
        List<Map<String, Object>> modelRecommendations = new ArrayList<>();

        for (JsonNode modelNode : modelRecommendationsNode) {
            Map<String, Object> modelMap = objectMapper.convertValue(modelNode, Map.class);
            modelRecommendations.add(modelMap);
        }

        return modelRecommendations;
    }

    private Map<String, Object> getGptResponse(Map<String, Object> selectedModel, Map<String, Object> fastApiResult) {
        String systemPrompt = promptGenerator.createSystemPromptForResult(selectedModel);
        String userPrompt = promptGenerator.createUserPromptForResult(fastApiResult);
        GptResultRequest gptRequest = new GptResultRequest(systemPrompt, userPrompt);
        String gptResponseContent = gptClient.callFunctionWithResultRequest("Bearer " + apiKey, gptRequest);
        return gptResponseParser.parseGptResponse(gptResponseContent);
    }

    private void saveToMongoDB(Query query, Map<String, Object> recommendedModels, Map<String, Object> selectedModel,
        Map<String, Object> fastApiResult, Map<String, Object> gptResultResponse, String chatRoomId) {
        Update update = new Update()
            .set("RecommendedModelFromLLM", recommendedModels)
            .set("SelectedModelFromUser", selectedModel)
            .set("ResultFromModel", fastApiResult)
            .set("ResultDescriptionFromLLM", gptResultResponse);
        mongoTemplate.upsert(query, update, "MongoDB");
        log.info("Saved analysis data with chatRoomId: {} in MongoDB", chatRoomId);
    }

    private Map<String, Object> selectModelByIndex(List<Map<String, Object>> recommendedModels, int selectedModelIndex) {
        if (selectedModelIndex < 0 || selectedModelIndex >= recommendedModels.size()) {
            throw new IllegalArgumentException("Invalid selected model index: " + selectedModelIndex);
        }

        // 선택한 모델의 implementation_request 추출
        Map<String, Object> selectedModel = (Map<String, Object>) recommendedModels.get(selectedModelIndex).get("implementation_request");


        // 필수 키가 없으면 null로 추가
        ensureKey(selectedModel, "model_choice");
        ensureKey(selectedModel, "feature_columns");
        ensureKey(selectedModel, "target_variable");
        ensureKey(selectedModel, "id_column");

        // 선택한 모델의 isSelected를 true로 설정
        recommendedModels.get(selectedModelIndex).put("isSelected", true);

        log.info("Selected model implementation_request: {}", selectedModel);
        return selectedModel;
    }
    private void ensureKey(Map<String, Object> model, String key) {
        if (!model.containsKey(key)) {
            model.put(key, null);
        }
    }

    public String conversation(String chatRoomId, int requestId, String answer) {
        // Step 1: MongoDB에서 chatRoomId와 requestId로 Document 조회
        Query query = new Query();
        query.addCriteria(Criteria.where("chatRoomId").is(chatRoomId).and("requestId").is(requestId));
        Document chatRoomDataDoc = mongoTemplate.findOne(query, Document.class, "MongoDB");

        if (chatRoomDataDoc == null) {
            log.warn("No data found for chatRoomId: {}, requestId: {}", chatRoomId, requestId);
            return "데이터를 찾을 수 없습니다.";
        }
        log.info("Step 1: Found MongoDB document for requestId: {}, chatRoomId: {}", requestId, chatRoomId);

        // Step 2: Document를 Map으로 변환
        Map<String, Object> chatRoomData = objectMapper.convertValue(chatRoomDataDoc, Map.class);

        // Step 3: 분석 결과가 없으면 반환
        Object analysis_result = chatRoomData.get("ResultFromModel");
        if (analysis_result == null) {
            return "분석결과가 없습니다.";
        }

        Object report_summary = chatRoomData.get("ResultDescriptionFromLLM");
        if (report_summary == null) {
            return "분석결과가 없습니다.";
        }

        // Step 4: ConversationRecord 리스트 확인 및 초기화
        List<Map<String, Object>> conversationRecord = (List<Map<String, Object>>) chatRoomData.get("ConversationRecord");
        if (conversationRecord == null) {
            conversationRecord = new ArrayList<>();
        }

        // Step 5: analysisContext 생성 및 GPT 프롬프트 생성
        Map<String, Object> analysisContext = new HashMap<>();
        analysisContext.put("analysis_result", analysis_result);
        analysisContext.put("report_summary", report_summary);
        analysisContext.put("previous_QA_summary", conversationRecord);

        String systemPrompt = promptGenerator.createSystemPromptForConversation(analysisContext);
        String userPrompt = promptGenerator.createUserPromptForConversation(answer);

        // Step 6: GPT 요청
        GptResultRequest gptRequest = new GptResultRequest(systemPrompt, userPrompt);
        String gptResponse = gptClient.callFunctionWithResultRequest("Bearer " + apiKey, gptRequest);

        // Step 7: Q&A 기록 생성 및 타임스탬프 추가
        Map<String, Object> qaEntry = new HashMap<>();
        qaEntry.put("question", answer);
        qaEntry.put("answer", gptResponse);
        qaEntry.put("timestamp", LocalDateTime.now().toString()); // 현재 시간 추가

        // Step 8: ConversationRecord에 새 Q&A 기록 추가
        conversationRecord.add(qaEntry);

        // Step 9: MongoDB에 업데이트 또는 삽입
        Update update = new Update()
            .set("ConversationRecord", conversationRecord);

        mongoTemplate.upsert(query, update, "MongoDB");

        log.info("Step 9: ConversationRecord updated or inserted with new entry for chatRoomId: {}, requestId: {}", chatRoomId, requestId);

        return changeGptStringToApiString(gptResponse);
    }

    private String changeGptStringToApiString(String gptString) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(gptString);
			return rootNode.at("/choices/0/message/content/answer").asText();
        } catch (Exception e) {
            log.warn(e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(e);
        }
	}
}

