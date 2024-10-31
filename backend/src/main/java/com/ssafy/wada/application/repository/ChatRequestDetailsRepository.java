package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChatRequestDetailsRepository extends MongoRepository<ChatRequestDetails, String> {

    // 추가 쿼리 메서드 정의 예시
    List<ChatRequestDetails> findByFileUrl(String fileUrl);
}
