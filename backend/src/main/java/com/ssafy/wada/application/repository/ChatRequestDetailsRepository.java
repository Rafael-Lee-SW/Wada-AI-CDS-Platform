package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import org.springframework.data.mongodb.repository.Query;

public interface ChatRequestDetailsRepository extends MongoRepository<ChatRequestDetails, String> {

    Optional<ChatRequestDetails> findById(String requestId);

   ChatRequestDetails findByRequestId(String requestId);

   String findFileUrlByRequestId(String requestId);
}
