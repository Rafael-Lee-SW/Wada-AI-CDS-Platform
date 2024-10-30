package com.ssafy.wada.application.repository;

import com.ssafy.wada.application.domain.ModelParameter;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ModelParameterRepository extends MongoRepository<ModelParameter, String> {

    // 추가 쿼리 메서드 정의 예시
    List<ModelParameter> findByFileUrl(String fileUrl);
}
