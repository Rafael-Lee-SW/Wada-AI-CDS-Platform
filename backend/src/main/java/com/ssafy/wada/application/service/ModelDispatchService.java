package com.ssafy.wada.application.service;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.client.openai.GptClient;
import com.ssafy.wada.client.openai.GptExplanationRequest;
import com.ssafy.wada.client.openai.GptRequest;
import com.ssafy.wada.client.openai.GptRequest.GptResultRequest;
import com.ssafy.wada.client.openai.GptResponseParser;
import com.ssafy.wada.client.openai.PromptGenerator;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import java.util.Map;
import org.springframework.data.mongodb.core.query.Query;

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

    @Value("${openai.api.key}")
    private String apiKey;
    public ModelDispatchResponse dispatchModel(String chatRoomId, Map<String, Object> selectedModel) {

        //Step 1

        log.info("step 1 강제 형 변환");


        // Step 2: fileUrl 가져오기
        log.info("step 2 fileUrl 가져오기");
        String fileUrl = chatRoomRepository.findFileUrlByChatRoomId(chatRoomId)
            .orElseThrow(() -> new IllegalArgumentException("ChatRoom not found for id: " + chatRoomId));
        log.info("Using file URL from request for chatRoomId: {}", chatRoomId);

        // Step 3: modelDetail의 내용만 추출하여 FastAPI로 전달
        log.info("step 3 Fetch FastAPI");
        log.info("fileUrl: {}", fileUrl);
        log.info("selectedModel {}", selectedModel);
        Map<String, Object> analysisResult = fastApiService.sendToFastApi(fileUrl, selectedModel);
        log.info("Received analysis result from FastAPI for chatRoomId: {}", chatRoomId);
        Map<String, Object> fastApiResult = (Map<String, Object>) analysisResult.get("result");
        log.info("step 3 Get FastAPI result: {}", fastApiResult);

        // step 4: Gpt Api 호출 결과받기 (SystemPrompt UserPrompt)
        log.info("step 4 Fetch GPT");
        String systemPrompt = promptGenerator.createSystemPromptForResult(selectedModel);
        String userPrompt = promptGenerator.createUserPromptForResult(fastApiResult);

        GptResultRequest gptRequest = new GptResultRequest(systemPrompt, userPrompt);
        String gptResponseContent = gptClient.callFunctionWithResultRequest("Bearer " + apiKey, gptRequest);
        Map<String, Object> gptResultResponse = gptResponseParser.parseGptResponse(gptResponseContent);
        log.info("Received GPT response : {}", gptResultResponse);
/**
 * Step 5: 몽고디비 결과 저장
 * chatRoomId를 키로 SelectedModelFromUser의 이름으로 SelectedModelFromUser를 저장
 * chatRoomId를 키로 ResultFromModel의 이름으로 fastApiResult를 저장
 * chatRoomId를 키로 ResultDescriptionFromLLM의 이름으로 gptResultResponse를 저장
 *
 */
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
        Update update = new Update()
            .set("SelectedModelFromUser", selectedModel)
            .set("ResultFromModel", fastApiResult)
            .set("ResultDescriptionFromLLM", gptResultResponse);
        mongoTemplate.upsert(query, update, "chatRoomCollection");
        log.info("Saved analysis data with chatRoomId: {} in MongoDB", chatRoomId);

        // Step 6:  SelectedModelFromUser,  ResultFromModel,ResultDescriptionFromLLM를 json으로 반환
        return ModelDispatchResponse.of(selectedModel, fastApiResult,gptResultResponse);
    }

}
