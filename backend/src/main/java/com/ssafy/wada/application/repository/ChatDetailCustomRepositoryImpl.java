package com.ssafy.wada.application.repository;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ChatDetailCustomRepositoryImpl implements ChatDetailCustomRepository {
	private final MongoTemplate mongoTemplate;
}
