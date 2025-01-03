package com.ssafy.wada.client.openai;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "chatgptClient", url = "${openai.api.url}")
public interface GptClient {

	@PostMapping("/chat/completions")
	String callFunction(@RequestHeader("Authorization") String authorization, @RequestBody GptRequest request);

	@PostMapping("/chat/completions")
	String callFunctionWithResultRequest(@RequestHeader("Authorization") String authorization, @RequestBody GptRequest.GptResultRequest request);
}
