package com.ssafy.wada.dto;

import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;

/**
 *  Logistic Regression
 *  이진 분류 모델로 특정 조건에 따른 결과 예측
 */
@Getter
@Setter
public class ModelLogisticRegressionDTO {
    private String filePath;
    private String modelChoice;
    private String targetVariable;
    private List<String> featureColumns;
    private List<Map<String, Object>> binaryConditions;
/**
 * curl -X POST "http://127.0.0.1:8000/predict" \
 * -H "Content-Type: application/json" \
 * -d '{
 *   "file_path": "./Human_Resources_Data_Set.csv",
 *   "model_choice": "logistic_regression",
 *   "target_variable": "Termd",
 *   "feature_columns": ["Salary", "EmpSatisfaction"],
 *   "binary_conditions": [{
 *     "column": "Salary",
 *     "operator": ">",
 *     "value": 100000,
 *     "target_column": "HighEarner"
 *   }]
 * }'
 */
}
