package com.ssafy.wada.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * K-Means Clustering
 * 데이터 군집화를 통해 패턴이나 그룹을 발견
 */
@Getter
@Setter
public class ModelKMeansClusteringDTO {
    private String filePath;
    private String modelChoice;
    private List<String> featureColumns;
    private Integer numClusters;
    private List<String> featureGenerations;
    /**
     * curl -X POST "http://127.0.0.1:8000/predict" \
     * -H "Content-Type: application/json" \
     * -d '{
     *   "file_path": "./Human_Resources_Data_Set.csv",
     *   "model_choice": "kmeans_clustering",
     *   "feature_columns": ["Position", "Department", "Salary", "TenureDays", "ManagerID"],
     *   "num_clusters": 4,
     *   "feature_generations": ["period:TenureDays:DateOfHire:DateOfTermination"]
     * }'
     * //  private int epochs;
     *   //  private int batchSize;
     */
}
