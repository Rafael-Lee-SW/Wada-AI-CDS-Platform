package com.ssafy.wada.presentation.response;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ChatHistoryDetailResponse {
    private String chatRoomId;                // ChatRoom의 ID
    private int requestId;                    // 요청 ID
    private String requirement;               // 사용자가 입력한 요구사항
    private String fileUrl;                   // 파일 URL
    private Map<String, Object> selectedModel;  // 사용자가 선택한 모델 정보
    private Map<String, Object> resultFromModel; // 모델의 분석 결과
    private Map<String, Object> resultDescription; // LLM의 분석 결과 설명
    private LocalDateTime createdTime;

}
