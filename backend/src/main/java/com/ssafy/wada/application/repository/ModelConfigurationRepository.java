package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.ModelConfiguration;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ModelConfigurationRepository extends MongoRepository<ModelConfiguration, String> {
    // modelChoice로 특정 모델 조회
    Optional<ModelConfiguration> findByModelChoice(String modelChoice);
}
