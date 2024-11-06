package com.ssafy.wada.client.s3;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;

@Getter
@Configuration
public class S3Properties {
	@Value("${aws.access-key}")
	private String accessKey;

	@Value("${aws.secret-key}")
	private String secretKey;

	@Value("${aws.region}")
	private String region;

	@Value("${aws.url}")
	private String url;

	@Value("${aws.bucket}")
	private String bucket;
}