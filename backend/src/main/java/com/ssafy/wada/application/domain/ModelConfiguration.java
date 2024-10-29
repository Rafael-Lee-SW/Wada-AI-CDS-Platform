package com.ssafy.wada.application.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.Map;

@Document(collection = "modelConfigurations")
public class ModelConfiguration {

    @Id
    private String id;

    // 공통 필드
    private String filePath;
    private String modelChoice;
    private List<String> featureColumns;

    // 선택적 필드
    private String targetVariable;                      // 예측 모델의 타겟 변수
    private Integer numClusters;                        // K-means 클러스터링 전용
    private Integer epochs;                             // 신경망 모델 전용
    private Integer batchSize;                          // 신경망 모델 전용
    private String nodeFeaturesPath;                    // 그래프 모델 전용
    private String edgesPath;                           // 그래프 모델 전용
    private String idColumn;                            // 그래프 모델 전용
    private List<String> featureGenerations;            // 그래프 및 K-means 모델 전용
    private List<String> additionalFeatures;            // 그래프 모델 전용
    private List<Map<String, Object>> binaryConditions; // 로지스틱 회귀 전용


}
