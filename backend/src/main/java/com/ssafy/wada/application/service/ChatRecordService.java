package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.Guest;
import com.ssafy.wada.application.repository.GuestRepository;
import com.ssafy.wada.presentation.response.ChatHistoryDetailResponse;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.bson.Document;
import com.ssafy.wada.application.dto.ChatHistoryResponse;
import java.time.ZoneId;
import java.util.Date;


@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRecordService {

    private final GuestRepository guestRepository;
    private final MongoTemplate mongoTemplate;


    public List<ChatHistoryResponse> getAllChatHistory(String sessionId) {
        // Eager 로딩 방식으로 Guest와 ChatRooms를 함께 조회
        Guest guest = guestRepository.findWithChatRoomsById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("No guest found for sessionId: " + sessionId));

        log.info("Step 2: Fetching chat history for each ChatRoom associated with sessionId: {}", sessionId);

        return guest.getChatRooms().stream().flatMap(chatRoom -> {
            String chatRoomId = chatRoom.getId();
            log.info("Processing ChatRoom with chatRoomId: {}", chatRoomId);

            // Step 2-1: MongoDB에서 chatRoomId로 요약 정보 조회 (여러 문서를 가져오기 위해 find 사용)
            Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
            List<Document> chatRoomDataList = mongoTemplate.find(query, Document.class, "MongoDB");

            // Step 2-2: MongoDB 조회 결과가 있을 경우 각 문서마다 ChatHistoryResponse 생성
            if (!chatRoomDataList.isEmpty()) {
                log.info("Data found in MongoDB for chatRoomId: {}", chatRoomId);
                return chatRoomDataList.stream().map(chatRoomData -> new ChatHistoryResponse(
                    chatRoomId,
                    (String) chatRoomData.get("requirement"),
                    chatRoomData.get("ResultDescriptionFromLLM"),
                    chatRoom.getCreatedAt()
                ));
            } else {
                log.warn("No data found in MongoDB for chatRoomId: {}", chatRoomId);
                return Stream.of(new ChatHistoryResponse(chatRoomId, "No data found", null,
                    chatRoom.getCreatedAt()));
            }
        }).collect(Collectors.toList());
    }
    @Transactional
    public List<ChatHistoryDetailResponse> getChatHistoryDetail(String sessionId,
        String chatRoomId) {
        log.info("Step 1: Fetching Guest with sessionId: {} to validate access to chatRoomId: {}",
            sessionId, chatRoomId);
        Guest guest = guestRepository.findById(sessionId)
            .orElseThrow(
                () -> new IllegalArgumentException("No guest found for sessionId: " + sessionId));

        boolean hasAccess = guest.getChatRooms().stream()
            .anyMatch(chatRoom -> chatRoom.getId().equals(chatRoomId));

        if (!hasAccess) {
            throw new IllegalArgumentException("Access denied for chatRoomId: " + chatRoomId);
        }

        log.info("Step 2: Fetching all chat history entries for chatRoomId: {} in MongoDB",
            chatRoomId);
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
        List<Document> chatRoomDataList = mongoTemplate.find(query, Document.class, "MongoDB");

        List<ChatHistoryDetailResponse> chatHistoryDetails = chatRoomDataList.stream()
            .map(chatRoomData -> {
                Integer requestId = (Integer) chatRoomData.get("requestId");
                String requirement = (String) chatRoomData.get("requirement");
                String fileUrl = (String) chatRoomData.get("fileUrl");
                Map<String, Object> selectedModel = (Map<String, Object>) chatRoomData.get(
                    "SelectedModelFromUser");
                Map<String, Object> resultFromModel = (Map<String, Object>) chatRoomData.get(
                    "ResultFromModel");
                Map<String, Object> resultDescription = (Map<String, Object>) chatRoomData.get(
                    "ResultDescriptionFromLLM");

                // MongoDB에서 생성 시간 가져오기 및 변환
                LocalDateTime createdTime = null;
                if (chatRoomData.get("createdTime") != null) {
                    Date createdDate = (Date) chatRoomData.get("createdTime");
                    createdTime = createdDate.toInstant().atZone(ZoneId.systemDefault())
                        .toLocalDateTime();
                }

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