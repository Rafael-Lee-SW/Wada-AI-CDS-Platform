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
	}
}
