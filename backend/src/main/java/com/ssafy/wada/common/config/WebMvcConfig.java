package com.ssafy.wada.common.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.ssafy.wada.presentation.resolver.SessionIdArgumentResolver;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

	private final SessionIdArgumentResolver sessionIdArgumentResolver;

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(sessionIdArgumentResolver);
	}
	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
			.allowedOrigins("https://k11a104.p.ssafy.io/", "http://localhost:3000")
			.allowedHeaders("*")
			.allowedMethods("HEAD", "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
			.allowCredentials(true)
			.maxAge(3600);
	}
}
