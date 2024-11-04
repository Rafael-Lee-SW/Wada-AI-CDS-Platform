package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import org.springframework.data.mongodb.repository.Query;

public interface ChatRequestDetailsRepository extends MongoRepository<ChatRequestDetails, String> {

    Optional<ChatRequestDetails> findById(String requestId);

    @Query(value = "{ '_id': ?0 }", fields = "{ 'recommendedLLM': 1, '_id': 0 }")
    Map<String, Object> findRecommendedLLMById(String requestId);


    @Query(value = "{ '_id': ?0 }", fields = "{ 'fileUrl': 1 }")
    Optional<String> findFileUrlByRequestId(String requestId);
}
