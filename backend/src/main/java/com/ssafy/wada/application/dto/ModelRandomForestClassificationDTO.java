package com.ssafy.wada.application.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Random Forest Classification
 * 분류 분석을 통한 이산형 클래스 예측
 */
@Getter
@Setter
public class ModelRandomForestClassificationDTO {

    private String filePath;
    private String modelChoice;
    private String targetVariable;
    private List<String> featureColumns;
/**
 *curl -X POST "http://127.0.0.1:8000/predict" \
 * -H "Content-Type: application/json" \
 * -d '{
 *   "file_path": "./Human_Resources_Data_Set.csv",
 *   "model_choice": "random_forest_classification",
 *   "target_variable": "Termd",
 *   "feature_columns": ["EmpSatisfaction", "EngagementSurvey", "PerfScoreID", "Salary", "TenureDays", "Absences", "DaysLateLast30", "Department", "Position", "ManagerID"]
 * }'
 */
}
