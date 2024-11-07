package com.ssafy.wada.application.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.ssafy.wada.application.domain.ChatRequestDetails;

public interface ChatDetailRepository
	extends MongoRepository<ChatRequestDetails, String>, ChatDetailCustomRepository {

}
