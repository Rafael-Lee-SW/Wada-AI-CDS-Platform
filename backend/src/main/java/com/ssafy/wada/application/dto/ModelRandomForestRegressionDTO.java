package com.ssafy.wada.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Random Forest Regression
 * 회귀 분석을 통한 연속형 값 예측
 */
@Getter
@Setter
public class ModelRandomForestRegressionDTO {
    private String filePath;
    private String modelChoice;
    private String targetVariable;
    private List<String> featureColumns;
/**
 * curl -X POST "http://127.0.0.1:8000/predict" \
 * -H "Content-Type: application/json" \
 * -d '{
 *   "file_path": "./Human_Resources_Data_Set.csv",
 *   "model_choice": "random_forest_regression",
 *   "target_variable": "PerfScoreID",
 *   "feature_columns": ["EmpSatisfaction", "EngagementSurvey", "SpecialProjectsCount", "Absences", "DaysLateLast30", "Department", "Position", "Salary", "TenureDays", "ManagerID"]
 * }'
 */
}
