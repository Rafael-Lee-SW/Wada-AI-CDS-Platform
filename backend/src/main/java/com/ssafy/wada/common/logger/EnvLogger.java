package com.ssafy.wada.common.logger;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class EnvLogger {

	private final Environment environment;

	@PostConstruct
	public void logEnvironmentVariables() {
		String activeProfile = environment.getProperty("spring.profiles.active");
		String dbUrl = environment.getProperty("DB_URL");
		String mongoUrl = environment.getProperty("MONGO_URL");
		String fastApiUrl = environment.getProperty("FAST_API_URL");
		String gptKey = environment.getProperty("GPT_KEY");

	}
}
