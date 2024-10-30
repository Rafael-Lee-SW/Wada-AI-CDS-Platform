package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.ChatRoom;
import com.ssafy.wada.application.domain.ModelParameter;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.ModelParameterRepository;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModelDispatchServiceImpl implements ModelDispatchService {

    private final ChatRoomRepository chatRoomRepository;
    private final ModelParameterRepository modelParameterRepository;
    private final RestTemplate restTemplate;

    /**
     *
     * @param chatRoomId
     * @param selectedModel
     * @return
     * 1. chatroom id로 ModelParameter 조회
     * 2. selectedModelData = model_recommendations[ selectedModel ]
     * ModelParamere의 recommendations의 selectedModel 항목을 selectedModelData에 초기화
     * 3.selectedModelData와 S3(csvfile path) pastApi로 전송
     * 4.result (resultSummary,recommendedLLM) 저장
     * 5.result LLM 서버에 설명 요청
     * 6.result(resultSummary, recommendedLLM, resultLlmDescription) 값  return
     */
    @Override
    public ModelDispatchResponse dispatchModel( String chatRoomId, int selectedModel) {
        String mongoId = getLatestMongoIdByChatRoomId(chatRoomId);
        ModelParameter modelParameter = getModelParameter(mongoId);
        Map<String, Object> selectedModelData = getSelectedModelData(modelParameter, selectedModel);
        Map<String, Object> analysisResult = sendToFastApi(modelParameter.getFileUrl(), selectedModelData);
        updateModelParameterWithAnalysisResult(mongoId, analysisResult);
        String llmDescription = requestLLMDescription(analysisResult.get("resultSummary"));

        return createResponse(mongoId, llmDescription);
    }

    /**
     *
     * @param chatRoomId
     * @return
     */
    private String getLatestMongoIdByChatRoomId(String chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
            .map(ChatRoom::getMongoId)
            .orElseThrow(() -> new RuntimeException("MongoId not found for chat room ID: " + chatRoomId));
    }


    private ModelParameter getModelParameter(String mongoId) {
        return modelParameterRepository.findById(mongoId)
            .orElseThrow(() -> new RuntimeException("ModelParameter not found for mongoId: " + mongoId));
    }

    private Map<String, Object> getSelectedModelData(ModelParameter modelParameter, int selectedModel) {
        Map<String, Object> recommendedLLM = modelParameter.getRecommendedLLM();
        @SuppressWarnings("unchecked")
        Map<String, Object> selectedModelData = ((List<Map<String, Object>>) recommendedLLM.get("model_recommendations")).get(selectedModel);
        return selectedModelData;
    }

    private Map<String, Object> sendToFastApi(String fileUrl, Map<String, Object> modelData) {
        String apiUrl = "http://localhost:8000/predict";
        modelData.put("file_path", fileUrl);  // Add file URL to the model data

        return restTemplate.postForObject(apiUrl, modelData, Map.class);
    }

    private void updateModelParameterWithAnalysisResult(String mongoId, Map<String, Object> analysisResult) {
        ModelParameter modelParameter = modelParameterRepository.findById(mongoId)
            .orElseThrow(() -> new RuntimeException("ModelParameter not found for mongoId: " + mongoId));

        modelParameter.setResultSummary((Map<String, Object>) analysisResult.get("resultSummary"));
        modelParameter.setResultAll((Map<String, Object>) analysisResult.get("resultAll"));
        modelParameterRepository.save(modelParameter);
    }

    private String requestLLMDescription(Object resultSummary) {
        // Assume resultSummary is JSON or Map<String, Object>, implement specific logic to convert and request LLM
        String llmDescription = "LLM-generated description based on result summary"; // Placeholder
        return llmDescription;
    }

    private ModelDispatchResponse createResponse(String mongoId, String llmDescription) {
        ModelParameter modelParameter = modelParameterRepository.findById(mongoId)
            .orElseThrow(() -> new RuntimeException("ModelParameter not found for mongoId: " + mongoId));

        modelParameter.setResultLlmDescription(llmDescription);
        modelParameterRepository.save(modelParameter);

        return ModelDispatchResponse.builder()
            .resultSummary(modelParameter.getResultSummary())
            .resultAll(modelParameter.getResultAll())
            .resultLlmDescription(modelParameter.getResultLlmDescription())
            .build();
    }
}
