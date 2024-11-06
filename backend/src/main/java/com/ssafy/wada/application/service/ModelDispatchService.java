package com.ssafy.wada.application.service;
import com.ssafy.wada.application.domain.FastApiService;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.presentation.response.ModelDispatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final FastApiService fastApiService;
    private final ChatRoomRepository chatRoomRepository;
//    private final GptPromptingService gptPromptingService;

    public ModelDispatchResponse dispatchModel(String chatRoomId, Object selectedModel) {
        Map<String, Object> modelMap = (Map<String, Object>) selectedModel;

        // Step 1: MongoDB에 chatRoomId와 selectedModel 데이터를 SelectedModelFromUser 필드명으로 저장
        Map<String, Object> modelDetail = (Map<String, Object>) selectedModel;
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
        Update update = new Update().set("SelectedModelFromUser", modelDetail);
        mongoTemplate.upsert(query, update, "chatRoomCollection");
        log.info("Saved selected model data with chatRoomId: {} under SelectedModelFromUser field", chatRoomId);

        // Step 2: fileUrl 가져오기
        String fileUrl = chatRoomRepository.findFileUrlByChatRoomId(chatRoomId)
            .orElseThrow(() -> new IllegalArgumentException("ChatRoom not found for id: " + chatRoomId));
        log.info("Using file URL from request for chatRoomId: {}", chatRoomId);

        // Step 3: modelDetail의 내용만 추출하여 FastAPI로 전달
        Map<String, Object> selectedModelDetail = (Map<String, Object>) modelMap.get("modelDetail");


        Map<String, Object> analysisResult = fastApiService.sendToFastApi(fileUrl, selectedModelDetail);
        log.info("Received analysis result from FastAPI for chatRoomId: {}", chatRoomId);
        Map<String, Object> fastApiResult = (Map<String, Object>) analysisResult.get("result");

//        // Step 4: GPT 프롬프트 호출로 분석 설명 생성(선택된모델과 분석결과 class로 구현)
//        Map<String, Object> resultDescription = gptPromptingService.getPromptingDescription(request,analysisResult);
//        log.info("Received description from GPT for chatRoomId: {}", chatRoomId);

        // Step 5: MongoDB에 분석 결과와 설명 저장
//        mongoTemplate.upsert(query, new Update().set("ResultFromModel", analysisResult)
//                .set("ResultDescriptionFromLLM", resultDescription),
//            "chatRoomCollection");
//        log.info("Saved analysis result and description for chatRoomId: {}", chatRoomId);

        // Step 6: ModelDispatchResponse 생성 후 반환

        ModelDispatchResponse modelDispatchResponse = ModelDispatchResponse.of(fastApiResult, fastApiResult);
        return modelDispatchResponse;

    }

}
