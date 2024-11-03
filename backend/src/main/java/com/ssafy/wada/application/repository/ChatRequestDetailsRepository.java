package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import com.ssafy.wada.application.domain.RecommendedLLM;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChatRequestDetailsRepository extends MongoRepository<ChatRequestDetails, String> {

    Optional<ChatRequestDetails> findById(String requestId);

    ChatRequestDetails findByRequestId(String requestId);

    ChatRequestDetails findFileUrlByRequestId(String requestId);


}
