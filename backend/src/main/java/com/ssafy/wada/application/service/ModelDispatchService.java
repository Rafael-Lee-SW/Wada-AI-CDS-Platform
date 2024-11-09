package com.ssafy.wada.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.client.openai.GptClient;
import com.ssafy.wada.client.openai.GptRequest.GptResultRequest;
import com.ssafy.wada.client.openai.GptResponseParser;
import com.ssafy.wada.client.openai.PromptGenerator;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
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

    @Value("${openai.api.key}")
    private String apiKey;

    public ModelDispatchResponse dispatchModel(String chatRoomId, int requestId, Map<String, Object> selectedModel) {

        // MongoDB에서 chatRoomId와 requestId에 해당하는 데이터를 가져옵니다.
        log.info("Step 1: MongoDB에서 chatRoomData 가져오기");
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId).and("requestId").is(requestId));

        // 먼저 Document 형식으로 데이터를 가져옵니다.
        Document chatRoomDataDoc = mongoTemplate.findOne(query, Document.class, "MongoDB");

        if (chatRoomDataDoc == null) {
            throw new IllegalArgumentException("No data found for chatRoomId: " + chatRoomId + " and requestId: " + requestId);
        }

        // Document 데이터를 Map<String, Object>로 변환합니다.
        Map<String, Object> chatRoomData = objectMapper.convertValue(chatRoomDataDoc, Map.class);
        log.info("chatRoomData : {}", chatRoomData);

        // fileUrl 추출
        String fileUrl = (String) chatRoomData.get("fileUrl");
        if (fileUrl == null) {
            throw new IllegalArgumentException("fileUrl not found for chatRoomId: " + chatRoomId + " and requestId: " + requestId);
        }

        log.info("Using file URL from MongoDB for chatRoomId: {}", chatRoomId);
        // RecommendedModelFromLLM 추출 및 선택된 모델의 isSelected를 true로 설정
        List<Map<String, Object>> recommendedModels = getRecommendedModels(chatRoomData, chatRoomId, requestId);
        String selectedModelName = (String) selectedModel.get("model_choice");
        updateModelSelection(recommendedModels, selectedModelName);

        // 모델 상세 정보를 FastAPI로 전달
        log.info("fileUrl: {}", fileUrl);
        Map<String, Object> analysisResult = fastApiService.sendToFastApi(fileUrl, selectedModel);
        Map<String, Object> fastApiResult = (Map<String, Object>) analysisResult.get("result");

        // GPT Api 호출 결과받기 (SystemPrompt UserPrompt)
        Map<String, Object> gptResultResponse = getGptResponse(selectedModel, fastApiResult);

        // MongoDB에 최종 데이터 저장
        saveToMongoDB(query, recommendedModels, selectedModel, fastApiResult, gptResultResponse, chatRoomId);

        // 결과 반환
        return ModelDispatchResponse.of(requestId, selectedModel, fastApiResult, gptResultResponse);
    }

    private List<Map<String, Object>> getRecommendedModels(Map<String, Object> chatRoomData, String chatRoomId, int requestId) {
        if (!chatRoomData.containsKey("RecommendedModelFromLLM")) {
            throw new IllegalArgumentException("RecommendedModelFromLLM not found for chatRoomId: " + chatRoomId + " and requestId: " + requestId);
        }

        // RecommendedModelFromLLM의 전체 데이터를 Map으로 가져오기
        Map<String, Object> recommendedModelData = (Map<String, Object>) chatRoomData.get("RecommendedModelFromLLM");

        // model_recommendations을 List<Map<String, Object>>로 추출
        if (recommendedModelData.containsKey("model_recommendations")) {
            return (List<Map<String, Object>>) recommendedModelData.get("model_recommendations");
        } else {
            throw new IllegalArgumentException("model_recommendations not found in RecommendedModelFromLLM for chatRoomId: " + chatRoomId + " and requestId: " + requestId);
        }
    }

    private void updateModelSelection(List<Map<String, Object>> recommendedModels, String selectedModelName) {
        boolean modelFound = false;

        // selectedModelName을 소문자로 변환하고, `_`와 공백을 제거하여 비교 형식을 통일합니다.
        selectedModelName = selectedModelName.toLowerCase().replace("_", " ").replace(" ", "");

        for (Map<String, Object> model : recommendedModels) {
            String analysisName = ((String) model.get("analysis_name")).toLowerCase().replace("_", " ").replace(" ", "");

            log.info("Comparing model_choice: '{}' with analysis_name: '{}'", selectedModelName, analysisName);

            if (selectedModelName.equals(analysisName)) {
                log.info("Match found for model_choice: {}", selectedModelName);
                model.put("isSelected", true);
                modelFound = true;
                break;
            }
        }
        if (!modelFound) {
            log.error("Model with analysis_name '{}' not found in RecommendedModelFromLLM.", selectedModelName);
            throw new IllegalArgumentException("Model with analysis_name " + selectedModelName + " not found in RecommendedModelFromLLM.");
        }
    }

    private Map<String, Object> getGptResponse(Map<String, Object> selectedModel, Map<String, Object> fastApiResult) {
        String systemPrompt = promptGenerator.createSystemPromptForResult(selectedModel);
        String userPrompt = promptGenerator.createUserPromptForResult(fastApiResult);
        GptResultRequest gptRequest = new GptResultRequest(systemPrompt, userPrompt);
        String gptResponseContent = gptClient.callFunctionWithResultRequest("Bearer " + apiKey, gptRequest);
        return gptResponseParser.parseGptResponse(gptResponseContent);
    }

    private void saveToMongoDB(Query query, List<Map<String, Object>> recommendedModels, Map<String, Object> selectedModel,
        Map<String, Object> fastApiResult, Map<String, Object> gptResultResponse, String chatRoomId) {
        Update update = new Update()
            .set("RecommendedModelFromLLM", recommendedModels)
            .set("SelectedModelFromUser", selectedModel)
            .set("ResultFromModel", fastApiResult)
            .set("ResultDescriptionFromLLM", gptResultResponse);

        mongoTemplate.upsert(query, update, "MongoDB");
        log.info("Saved analysis data with chatRoomId: {} in MongoDB", chatRoomId);
    }
}
