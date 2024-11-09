package com.ssafy.wada.application.dto;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ChatHistoryResponse {
    private String chatRoomId;          // ChatRoom의 ID
    private String requirement;          // 사용자가 입력한 요구사항
    private Object resultDescription;    // LLM의 분석 결과 설명
    private LocalDateTime createdTime;   // ChatRoom의 생성 시간
}
