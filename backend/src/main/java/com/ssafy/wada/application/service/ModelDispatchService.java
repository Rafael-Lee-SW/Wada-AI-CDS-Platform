package com.ssafy.wada.application.service;

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
    //private final GptPromptingService gptPromptingService;

    public void dispatchModel(String chatRoomId, Map<String, Object> request) {

        // Step 1: MongoDB에 chatRoomId와 JSON 데이터를 SelectedModelFromUser 필드명으로 저장
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
        Update update = new Update().set("SelectedModelFromUser", request);
        mongoTemplate.upsert(query, update, "chatRoomCollection");
        log.info("Saved selected model data with chatRoomId: {} under SelectedModelFromUser field", chatRoomId);

        // Step 2: fileUrl 가져오기
        String fileUrl = (String) request.get("file_path");
        log.info("Using file URL from request for chatRoomId: {}", chatRoomId);

        // Step 3: FastAPI로 데이터 전달 후 분석 결과 받기
        Map<String, Object> analysisResult = fastApiService.sendToFastApi(request);
        log.info("Received analysis result from FastAPI for chatRoomId: {}", chatRoomId);

        // Step 4: GPT 프롬프트 호출로 분석 설명 생성(선택된모델과 분석결과 class로 구현)
        //Map<String, Object> resultDescription = gptPromptingService.getPromptingDescription(request,analysisResult);
        log.info("Received description from GPT for chatRoomId: {}", chatRoomId);

        // Step 5: MongoDB에 분석 결과와 설명 저장
        //mongoTemplate.upsert(query, new Update().set("ResultFromModel", analysisResult)
        //        .set("ResultDescriptionFromLLM", resultDescription),
        //    "chatRoomCollection");
        log.info("Saved analysis result and description for chatRoomId: {}", chatRoomId);
/**
        // Step 6: ModelDispatchResponse 생성 후 반환
        return ModelDispatchResponse.of(
            (Map<String, Object>) analysisResult.get("resultSummary"),
            (Map<String, Object>) analysisResult.get("resultAll"),
            resultDescription
        );
 **/
    }
}
