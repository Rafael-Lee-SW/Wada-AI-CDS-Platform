package com.ssafy.wada.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Neural Network Regression
 * 신경망을 이용해 복잡한 패턴 학습 및 연속형 값 예측
 * (그래프 데이터 생성 불필요 버전)
 */
@Getter
@Setter
public class ModelNeuralNetworkRegressionNoFeatureDTO {
    private String filePath;
    private String modelChoice;
    private String nodeFeaturesPath;
    private String edgesPath;
    private String idColumn;
    /**
     * curl -X POST "http://127.0.0.1:8000/predict" \
     * -H "Content-Type: application/json" \
     * -d '{
     *   "file_path": "./Human_Resources_Data_Set.csv",
     *   "model_choice": "graph_neural_network_analysis",
     *   "node_features_path": "./data/node_features.csv",
     *   "edges_path": "./data/edges.csv",
     *   "id_column": "EmployeeID"
     * }'
     */
}
