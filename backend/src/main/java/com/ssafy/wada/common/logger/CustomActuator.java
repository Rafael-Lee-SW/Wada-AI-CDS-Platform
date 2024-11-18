package com.ssafy.wada.common.logger;

import java.util.HashMap;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.ssafy.wada.application.domain.MachineLearningModel;
import com.ssafy.wada.application.repository.ModelRepository;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomActuator {

	private final MeterRegistry meterRegistry;
	private final ModelRepository modelRepository;

	@Scheduled(fixedRate = 30000) // 30초마다 실행
	public void updateMetrics() {
		var models = modelRepository.findAll();

		for (var model : models) {
			String modelName = model.getModelName();

			Gauge.builder("custom_model_selection", model::getSelected)
				.description("Number of selected items for each model")
				.tag("model", modelName)
				.strongReference(true)
				.register(meterRegistry);

			Gauge.builder("custom_model_recommendation", model::getRecommended)
				.description("Number of recommended items for each model")
				.tag("model", modelName)
				.strongReference(true)
				.register(meterRegistry);
		}
	}
}
