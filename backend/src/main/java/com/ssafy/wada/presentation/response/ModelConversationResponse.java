package com.ssafy.wada.presentation.response;

import java.time.LocalDateTime;

public record ModelConversationResponse(int requestId, String answer, LocalDateTime timestamp) {}