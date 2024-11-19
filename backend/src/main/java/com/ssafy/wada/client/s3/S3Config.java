package com.ssafy.wada.client.s3;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class S3Config {

	private final S3Properties properties;

	@Bean
	public AmazonS3 amazonS3(){
		AWSCredentials credentials  = new BasicAWSCredentials(properties.getAccessKey(), properties.getSecretKey());
		return AmazonS3ClientBuilder
			.standard()
			.withCredentials(new AWSStaticCredentialsProvider(credentials))
			.withRegion(properties.getRegion())
			.build();
	}

	@Bean
	public S3Client s3Client(AmazonS3 amazonS3){
		return new S3ClientImpl(amazonS3, properties.getBucket(), properties.getUrl());
	}
}
