package com.ssafy.wada.client.s3;

import java.util.HashMap;
import java.util.Map;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.ssafy.wada.application.domain.util.AttachedFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class S3ClientImpl implements S3Client {

	private final AmazonS3 amazonS3;

	private final String bucketName;

	private final String url;

	@Override
	public String upload(AttachedFile file) {
		log.info("upload");
		Map<String, String> metadata = new HashMap<>();
		metadata.put("file-type", "csv");

		ObjectMetadata objectMetadata = new ObjectMetadata();
		objectMetadata.setContentLength(file.length());
		objectMetadata.setContentType("text/csv");
		objectMetadata.setUserMetadata(metadata);

		PutObjectRequest request = new PutObjectRequest(
			bucketName,
			file.randomName(file.extension(".csv")),
			file.inputStream(),
			objectMetadata);
		return executePut(request);
	}

	public S3Object get(String key) {
		GetObjectRequest request = new GetObjectRequest(bucketName, key);
		return amazonS3.getObject(request);
	}

	private String executePut(PutObjectRequest request) {
		log.info("executePut");
		amazonS3.putObject(request.withCannedAcl(CannedAccessControlList.PublicRead));
		StringBuilder sb = new StringBuilder(url);
		if (!url.endsWith("/"))
			sb.append("/");
		sb.append(bucketName);
		sb.append("/");
		sb.append(request.getKey());
		log.info(sb.toString());
		return sb.toString();
	}
}
