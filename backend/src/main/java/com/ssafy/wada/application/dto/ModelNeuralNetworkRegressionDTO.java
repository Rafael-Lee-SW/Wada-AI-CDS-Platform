package com.ssafy.wada.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Neural Network Regression
 * 신경망을 이용해 복잡한 패턴 학습 및 연속형 값 예측
 */
@Getter
@Setter
public class ModelNeuralNetworkRegressionDTO {
    private String filePath;
    private String modelChoice;
    private String targetVariable;
    private List<String> featureColumns;
    private Integer epochs;
    private Integer batchSize;
    /**
     * curl -X POST "http://127.0.0.1:8000/predict" \
     * -H "Content-Type: application/json" \
     * -d '{
     *   "file_path": "./Human_Resources_Data_Set.csv",
     *   "model_choice": "neural_network_regression",
     *   "target_variable": "Sales",
     *   "feature_columns": ["MarketingBudget", "StoreSize", "CustomerSatisfaction"],
     *   "epochs": 100,
     *   "batch_size": 20
     * }'
     */
}
