package com.ssafy.wada.application.domain;

import static org.apache.commons.io.FilenameUtils.*;
import static org.apache.commons.lang3.StringUtils.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.FileErrorCode;

public record AttachedFile(String originalFileName, String contentType, byte[] bytes) {

	private static void verify(MultipartFile multipartFile) {
		String contentType = multipartFile.getContentType();
		if (contentType == null || !contentType.equalsIgnoreCase("text/csv")) {
			throw new BusinessException(FileErrorCode.INVALID_CONTENT_TYPE);
		}

		if (multipartFile.isEmpty() || multipartFile.getSize() == 0) {
			throw new BusinessException(FileErrorCode.EMPTY_FILE);
		}
	}

	public static AttachedFile toAttachedFile(MultipartFile multipartFile) {
		try {
			verify(multipartFile);

			return new AttachedFile(
				multipartFile.getOriginalFilename(),
				multipartFile.getContentType(),
				multipartFile.getBytes()
			);
		} catch (IOException e) {
			throw new BusinessException(FileErrorCode.FILE_READ_ERROR);
		}
	}

	public String extension(String defaultExtension) {
		return defaultIfEmpty(getExtension(originalFileName), defaultExtension);
	}

	public String randomName(String defaultExtension) {
		return randomName(null, defaultExtension);
	}

	public String randomName(String basePath, String defaultExtension) {
		String name = isEmpty(basePath) ? UUID.randomUUID().toString() : basePath + "/" + UUID.randomUUID();
		return name + "." + extension(defaultExtension);
	}

	public InputStream inputStream() {
		return new ByteArrayInputStream(bytes);
	}

	public long length() {
		return bytes.length;
	}
}