package com.ssafy.wada.client.s3;

import com.ssafy.wada.application.domain.util.AttachedFile;

public interface S3Client {
	String upload(AttachedFile file);
}
