package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.ChatRequestDetails;
import com.ssafy.wada.application.domain.RecommendedLLM;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChatRequestDetailsRepository extends MongoRepository<ChatRequestDetails, String> {


    List<RecommendedLLM> findRecommendedLLMByRequestId(String requestId);

    ChatRequestDetails findByRequestId(String requestId);

    ChatRequestDetails findFileUrlByRequestId(String requestId);


}
