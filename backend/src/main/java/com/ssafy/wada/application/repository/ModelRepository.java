package com.ssafy.wada.application.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ssafy.wada.application.domain.MachineLearningModel;

public interface ModelRepository extends JpaRepository<MachineLearningModel, Integer> {
}
