package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.Guest;
import com.ssafy.wada.application.repository.GuestRepository;
import com.ssafy.wada.presentation.response.ChatHistoryDetailResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.bson.Document;
import com.ssafy.wada.application.dto.ChatHistoryResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRecordService {

    private final GuestRepository guestRepository;
    private final MongoTemplate mongoTemplate;

    public List<ChatHistoryResponse> getAllChatHistory(String sessionId) {
        // Step 1: RDBMS에서 sessionId를 통해 Guest 조회 및 ChatRoom 목록 가져오기
        log.info("Step 1: Fetching Guest with sessionId: {}", sessionId);
        Guest guest = guestRepository.findById(sessionId)
            .orElseThrow(
                () -> new IllegalArgumentException("No guest found for sessionId: " + sessionId));

        // Step 2: 각 ChatRoom의 chatRoomId를 통해 MongoDB에서 요약 정보 조회
        log.info("Step 2: Fetching chat history for each ChatRoom associated with sessionId: {}",
            sessionId);
        return guest.getChatRooms().stream().map(chatRoom -> {
            String chatRoomId = chatRoom.getId();
            log.info("Processing ChatRoom with chatRoomId: {}", chatRoomId);

            // Step 2-1: MongoDB에서 chatRoomId로 요약 정보 조회
            Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
            Document chatRoomData = mongoTemplate.findOne(query, Document.class, "MongoDB");

            // Step 2-2: MongoDB 조회 결과가 있을 경우 ChatHistoryResponse 생성
            if (chatRoomData != null) {
                log.info("Data found in MongoDB for chatRoomId: {}", chatRoomId);
                return new ChatHistoryResponse(
                    chatRoomId,
                    (String) chatRoomData.get("requirement"),
                    chatRoomData.get("ResultDescriptionFromLLM"),
                    chatRoom.getCreatedAt()
                );
            } else {
                log.warn("No data found in MongoDB for chatRoomId: {}", chatRoomId);
                return new ChatHistoryResponse(chatRoomId, "No data found", null,
                    chatRoom.getCreatedAt());
            }
        }).collect(Collectors.toList());
    }

    public List<ChatHistoryDetailResponse> getChatHistoryDetail(String sessionId, String chatRoomId) {
        // Step 1: RDBMS에서 sessionId를 통해 Guest 조회하여 chatRoomId에 대한 접근 권한 확인
        log.info("Step 1: Fetching Guest with sessionId: {} to validate access to chatRoomId: {}", sessionId, chatRoomId);
        Guest guest = guestRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("No guest found for sessionId: " + sessionId));

        boolean hasAccess = guest.getChatRooms().stream()
            .anyMatch(chatRoom -> chatRoom.getId().equals(chatRoomId));

        if (!hasAccess) {
            throw new IllegalArgumentException("Access denied for chatRoomId: " + chatRoomId);
        }

        // Step 2: MongoDB에서 chatRoomId로 모든 요청 데이터 조회
        log.info("Step 2: Fetching all chat history entries for chatRoomId: {} in MongoDB", chatRoomId);
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
        List<Document> chatRoomDataList = mongoTemplate.find(query, Document.class, "MongoDB");

        // Step 3: 조회한 데이터들을 ChatHistoryDetailResponse 리스트로 변환
        List<ChatHistoryDetailResponse> chatHistoryDetails = chatRoomDataList.stream().map(chatRoomData -> {
            Integer requestId = (Integer) chatRoomData.get("requestId");
            String requirement = (String) chatRoomData.get("requirement");
            String fileUrl = (String) chatRoomData.get("fileUrl");
            Map<String, Object> selectedModel = (Map<String, Object>) chatRoomData.get("SelectedModelFromUser");
            Map<String, Object> resultFromModel = (Map<String, Object>) chatRoomData.get("ResultFromModel");
            Map<String, Object> resultDescription = (Map<String, Object>) chatRoomData.get("ResultDescriptionFromLLM");

            // MongoDB에서 생성 시간 가져오기
            LocalDateTime createdTime = chatRoomData.get("createdTime") != null
                ? LocalDateTime.parse(chatRoomData.get("createdTime").toString())
                : null;

            return new ChatHistoryDetailResponse(
                chatRoomId,
                requestId,
                requirement,
                fileUrl,
                selectedModel,
                resultFromModel,
                resultDescription,
                createdTime
            );
        }).collect(Collectors.toList());

        return chatHistoryDetails;
    }

}