package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.Guest;
import com.ssafy.wada.application.repository.GuestRepository;
import com.ssafy.wada.presentation.response.ChatHistoryDetailResponse;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.Data;
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
        Guest guest = guestRepository.findWithChatRoomsById(sessionId).orElse(null);

        if (guest == null) {
            log.warn("No guest found for sessionId: {}", sessionId);
            return Collections.emptyList();
        }
        log.info("Fetching chat history for each ChatRoom associated with sessionId: {}",
            sessionId);

        return guest.getChatRooms().stream().flatMap(chatRoom -> {
            String chatRoomId = chatRoom.getId();
            log.info("Processing ChatRoom with chatRoomId: {}", chatRoomId);

            Query query = new Query(
                Criteria.where("chatRoomId").is(chatRoomId).and("requestId").is(1)
            );
            List<Document> chatRoomDataList = mongoTemplate.find(query, Document.class, "MongoDB");

            if (!chatRoomDataList.isEmpty()) {
                log.info("Data found in MongoDB for chatRoomId: {}", chatRoomId);
                return chatRoomDataList.stream().map(chatRoomData -> new ChatHistoryResponse(
                    chatRoomId,
                    (String) chatRoomData.get("fileName"),
                    (String) chatRoomData.get("requirement"),
                    chatRoomData.get("ResultDescriptionFromLLM"),
                    chatRoom.getCreatedAt()
                ));
            } else {
                log.warn("No data found in MongoDB for chatRoomId: {}", chatRoomId);
                return Stream.of(new ChatHistoryResponse(chatRoomId, "No data found", null, null,
                    chatRoom.getCreatedAt()));
            }
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<ChatHistoryDetailResponse> getChatHistoryDetail(String sessionId, String chatRoomId) {
        log.info("Fetching Guest with sessionId: {} to validate access to chatRoomId: {}", sessionId, chatRoomId);
        Guest guest = guestRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("No guest found for sessionId: " + sessionId));

        boolean hasAccess = guest.getChatRooms().stream()
            .anyMatch(chatRoom -> chatRoom.getId().equals(chatRoomId));

        if (!hasAccess) {
            throw new IllegalArgumentException("Access denied for chatRoomId: " + chatRoomId);
        }

        log.info("Fetching all chat history entries for chatRoomId: {} in MongoDB", chatRoomId);
        Query query = new Query(Criteria.where("chatRoomId").is(chatRoomId));
        List<Document> chatRoomDataList = mongoTemplate.find(query, Document.class, "MongoDB");

        List<ChatHistoryDetailResponse> chatHistoryDetails = chatRoomDataList.stream()
            .map(chatRoomData -> {
                Integer requestId = (Integer) chatRoomData.get("requestId");
                String requirement = (String) chatRoomData.get("requirement");
                String fileUrl = (String) chatRoomData.get("fileUrl");

                Map<String, Object> selectedModel = (Map<String, Object>) chatRoomData.get("SelectedModelFromUser");
                Map<String, Object> resultFromModel = (Map<String, Object>) chatRoomData.get("ResultFromModel");
                Map<String, Object> resultDescription = (Map<String, Object>) chatRoomData.get("ResultDescriptionFromLLM");
                List<Map<String, Object>> conversationRecord = (List<Map<String, Object>>) chatRoomData.get("ConversationRecord");

                // MongoDB에서 생성 시간을 가져와 LocalDateTime으로 변환
                LocalDateTime createdTime = null;
                if (chatRoomData.get("createdTime") != null) {
                    Object createdTimeObj = chatRoomData.get("createdTime");
                    if (createdTimeObj instanceof String) {
                        createdTime = OffsetDateTime.parse((String) createdTimeObj, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                            .toLocalDateTime();
                    } else if (createdTimeObj instanceof Date) {
                        createdTime = ((Date) createdTimeObj).toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                    }
                }
                return new ChatHistoryDetailResponse(
                    chatRoomId,
                    requestId,
                    requirement,
                    fileUrl,
                    selectedModel,
                    resultFromModel,
                    resultDescription,
                    conversationRecord, // conversationRecord 추가
                    createdTime
                );
            }).collect(Collectors.toList());

        return chatHistoryDetails;
    }
}