package com.ssafy.wada.client.openai;

import java.util.List;
import java.util.Map;

public record GptRequest(String model, List<Message> messages, Map<String, String> response_format) {

	public GptRequest(List<Message> messages) {
		this("gpt-4o", messages, Map.of("type", "json_object"));
	}

	public record Message(String role, String content) {

		public static Message roleUserMessage(String content) {
			return new Message("user", content);
		}

		public static Message roleSystemMessage(String content) {
			return new Message("system", content);
		}
	}

	// Factory method for creating a user message GptRequest
	public static GptRequest createUserRequest(String userMessage) {
		return new GptRequest(List.of(Message.roleUserMessage(userMessage)));
	}

	// Factory method for creating a system and user message GptRequest
	public static GptRequest createSystemUserRequest(String systemMessage, String userMessage) {
		return new GptRequest("gpt-4o",
			List.of(
				Message.roleSystemMessage(systemMessage),
				Message.roleUserMessage(userMessage)
			),
			Map.of("type", "json_object")
		);
	}

	public static record GptResultRequest(String model, List<Message> messages, Map<String, String> response_format) {
		public GptResultRequest(String systemPrompt, String userPrompt) {
			this("gpt-4o", List.of(
				Message.roleSystemMessage(systemPrompt),
				Message.roleUserMessage(userPrompt)
			), Map.of("type", "json_object"));
		}

		public static record Message(String role, String content) {
			public static Message roleUserMessage(String content) {
				return new Message("user", content);
			}
			public static Message roleSystemMessage(String content) {
				return new Message("system", content);
			}
		}
	}
}
