package com.ssafy.wada.client.openai;

import java.util.List;
import java.util.Map;

public record GptExplanationRequest(String model, List<Message> messages, Map<String, String> response_format) {

    public GptExplanationRequest(String systemPrompt, String userPrompt) {
        this("gpt-4o", createMessages(systemPrompt, userPrompt), Map.of("type", "json_object"));
    }

    private static List<Message> createMessages(String systemPrompt, String userPrompt) {
        return List.of(
            Message.roleSystemMessage(systemPrompt),
            Message.roleUserMessage(userPrompt)
        );
    }

    public record Message(String role, String content) {
        public static Message roleUserMessage(String content) {
            return new Message("user", content);
        }

        public static Message roleSystemMessage(String content) {
            return new Message("system", content);
        }
    }
}
