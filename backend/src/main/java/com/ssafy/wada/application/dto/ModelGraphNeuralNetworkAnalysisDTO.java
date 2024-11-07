package com.ssafy.wada.application.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Graph Neural Network Analysis
 * 그래프 구조 데이터를 분석하여 노드 간 관계 파악
 */
@Getter
@Setter
public class ModelGraphNeuralNetworkAnalysisDTO {
    private String filePath;
    private String modelChoice;
    private String nodeFeaturesPath;
    private String edgesPath;
    private String idColumn;
    private List<String> featureGenerations;
    private List<String> additionalFeatures;
    /**
     * curl -X POST "http://127.0.0.1:8000/predict" \
     * -H "Content-Type: application/json" \
     * -d '{
     *   "file_path": "./Human_Resources_Data_Set.csv",
     *   "model_choice": "graph_neural_network_analysis",
     *   "node_features_path": "./data/node_features.csv",
     *   "edges_path": "./data/edges.csv",
     *   "id_column": "EmployeeID",
     *   "feature_generations": ["period:TenureDays:DateOfHire:DateOfTermination"],
     *   "additional_features": ["PerformanceScore", "SatisfactionLevel"]
     * }'
     */
}
