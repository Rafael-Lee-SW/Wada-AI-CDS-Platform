package com.ssafy.wada.client.openai;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

@Component
public class PromptGenerator {
    //recommendPrompt 생성 메서드
    // recommendPrompt 생성 메서드
    public static String createRecommendedModelFromLLM(List<Map<String, Object>> request, String analysisPurpose) {

        String formattedJson = null;
        try {
            ObjectMapper mapper = new ObjectMapper();
            ObjectWriter writer = mapper.writerWithDefaultPrettyPrinter();
            formattedJson = writer.writeValueAsString(request);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return String.format("""
            # Role and Context
            You are an expert data scientist responsible for analyzing multiple CSV files and recommending the most appropriate machine learning models based on each dataset. Your recommendations should be directly applicable to the Ray ML server implementation.
                       \s
            # Input Data
            1. Data Structure:
               ```
               %s
               ```
                       \s
            2. User's Analysis Purpose:
               %s
                       \s
            3. Available Models:
               ```
               1. random_forest_regression
                  - For numerical target prediction
                  - Handles both numerical and categorical features
                  - Provides feature importance
                  - Required: feature_columns, target_variable, id_column
                  - Example: Performance score prediction, salary forecasting
                       \s
               2. random_forest_classification
                  - For categorical outcome prediction
                  - Handles both numerical and categorical features
                  - Provides feature importance
                  - Required: feature_columns, target_variable, id_column
                  - Example: Employee termination prediction
                       \s
               3. logistic_regression_binary
                  - For binary classification with custom conditions
                  - Highly interpretable results
                  - Provides probability scores
                  - Required: feature_columns, target_variable
                  - Optional: binary_conditions[{
                    column, operator, value, target_column
                  }]
                  - Example: Overpaid employee identification
                       \s
               4. logistic_regression_multinomial
                  - For attrition risk prediction
                  - Highly interpretable results
                  - Provides probability scores
                  - Required: feature_columns, target_variable
                  - Example: Employee attrition risk prediction
                       \s
               5. kmeans_clustering_segmentation
                  - For identifying employee segments
                  - Unsupervised learning
                  - Pattern discovery
                  - Required: feature_columns
                  - Optional: num_clusters(default=3)
                  - Example: Employee segmentation analysis
                       \s
               6. kmeans_clustering_anomaly_detection
                  - For detecting unusual patterns
                  - Unsupervised learning
                  - Anomaly discovery
                  - Required: feature_columns
                  - Optional: num_clusters(default=3), threshold
                  - Example: Unusual behavior pattern detection
                       \s
               7. neural_network_regression
                  - For complex regression tasks
                  - Handles non-linear relationships
                  - Requires sufficient data volume
                  - Required: feature_columns, target_variable
                  - Optional: epochs(default=100), batch_size(default=20)
                  - Example: Performance score prediction
                       \s
               8. graph_neural_network_analysis
                  - For analyzing network relationships
                  - Identifies complex patterns
                  - Network structure analysis
                  - Required:\s
                    - node_features_path
                    - edges_path
                    - id_column
                    - edge_source_column
                    - edge_target_column
                  - Optional:\s
                    - additional_features
                    - feature_generations[{
                        type: "period",
                        new_column: string,
                        start_column: string,
                        end_column: string
                      }]
                  - Example: Organizational network analysis
               ```
                       \s
            # Response Format and Style Guidelines
            1. Format Requirements:
               - Response must be in valid JSON format only
               - No additional text or explanations outside the JSON structure
               - All JSON fields must be present exactly as specified
                       \s
            2. Korean Language Style:
               - Use polite and professional language (합니다/습니다 style)
               - Provide detailed explanations that non-technical users can understand
               - Include specific examples and implications where appropriate
               - Maintain a helpful and supportive tone
                       \s
            3. Content Guidelines for Korean Sections:
               ```
               purpose_understanding:
                 - main_goal: 분석의 궁극적인 목표를 구체적으로 설명
                 - specific_requirements: 각 요구사항을 단계별로 상세히 설명
                 - expected_outcomes: 기대되는 결과와 그 활용방안을 자세히 기술
                       \s
               data_overview:
                 - structure_summary: 데이터의 전반적인 구조와 특징을 종합적으로 설명
                 - key_characteristics: 중요한 데이터 특성을 bullet point로 명확하게 나열
                 - relevant_columns: 각 칼럼이 분석에 어떻게 기여하는지 설명
                       \s
               model_recommendations:
              - analysis_name: 선택한 모델의 이름, 역할과 분석을 통해 달성하려는 목적
              - analysis_description: 각 추천 모델에 대한 분석 설명 (기준이 되는 모든 칼럼들, 모델의 상세 분석 방식, 예상 결과 포함)
              - selection_reasoning:\s
                • model_selection_reason: 데이터 특성과 분석 목적을 고려한 모델 선택의 구체적인 이유
                • business_value: 실제 비즈니스 현장에서의 활용 방안과 기대되는 가치
                • expected_results: 분석을 통해 도출될 수 있는 구체적인 결과와 인사이트
                • considerations: 분석 시 고려해야 할 제한사항과 주의점
                • model_advantages: 해당 모델이 가진 차별화된 장점과 특징
               ```
                       \s
            4. Examples of Appropriate Korean Explanations:
               ```json
            {
               "main_goal": "고객님의 매출 데이터를 활용하여 향후 3개월 간의 매출을 예측하고, 이를 통해 재고 관리 및 마케팅 전략 수립에 도움을 드리고자 합니다.",
              \s
               "structure_summary": "제공해 주신 데이터는 총 12개월 간의 일별 매출 기록으로, 제품별 판매량과 관련 마케팅 활동이 상세히 기록되어 있습니다. 특히 계절성이 뚜렷하게 나타나는 특징을 보이고 있습니다.",
              \s
               "selection_reasoning": {
                  "model_selection_reason": "RandomForestRegressor 모델은 고객님의 매출 데이터가 보여주는 복잡한 패턴과 계절성을 효과적으로 학습할 수 있는 알고리즘입니다. 특히 다양한 변수들 간의 비선형적 관계를 자동으로 포착할 수 있어 매출 예측에 매우 적합합니다.",
                 \s
                  "business_value": "이 분석을 통해 향후 3개월의 매출을 예측함으로써, 재고 수준 최적화, 인력 운영 계획 수립, 그리고 마케팅 예산 배분을 보다 효율적으로 진행하실 수 있습니다. 특히 성수기/비수기 패턴을 미리 파악하여 선제적인 대응이 가능합니다.",
                 \s
                  "expected_results": "각 제품별, 기간별 예상 매출액과 함께 매출에 영향을 미치는 주요 요인들의 중요도를 파악하실 수 있습니다. 이를 통해 어떤 마케팅 활동이 매출 증대에 가장 효과적인지 구체적으로 확인할 수 있습니다.",
                 \s
                  "considerations": "정확한 예측을 위해서는 외부 요인(예: 대형 프로모션, 시장 환경 변화)에 대한 정보도 함께 고려되어야 합니다. 또한, 새로운 제품 출시나 급격한 시장 변화가 있을 경우 모델의 재학습이 필요할 수 있습니다.",
                 \s
                  "model_advantages": "1) 다양한 변수들 간의 복잡한 상호작용을 자동으로 학습합니다. 2) 변수 중요도를 통해 의사결정의 근거를 명확히 제시할 수 있습니다. 3) 과적합 위험이 적어 안정적인 예측이 가능합니다. 4) 이상치에 대해 강건한 예측을 제공합니다."
               }
            }
               ```
                       \s
            5. Response Format
            ```
            {
                "purpose_understanding": {
                    "main_goal": "Primary analysis objective",
                    "specific_requirements": ["Specific analysis requirements"],
                    "expected_outcomes": ["Expected insights or predictions"]
                },
                "data_overview": [
                    {
                        "file_name": "Name of the file",
                        "structure_summary": "Overview of the data structure",
                        "key_characteristics": ["Important data characteristics"],
                        "relevant_columns": ["Columns relevant to the analysis goal"]
                    },
                    ...
                ],
                "model_recommendations": [
                    {
                        "file_name": "Name of the file the recommendation is based on",
                        "analysis_name": "Human readable name of the model and short description of analysis from model",
                        "analysis_description": "Explanation of the analysis criteria, methodology, and expected outcomes based on all feature columns.",
                        "selection_reasoning": {
                            "model_selection_reason": "이 모델을 선택한 구체적인 이유와 데이터 특성과의 연관성",
                            "business_value": "이 분석이 비즈니스에 제공할 수 있는 실질적인 가치와 의사결정 지원 방안",
                            "expected_results": "예상되는 분석 결과물과 그 해석 방법",
                            "considerations": "데이터 품질, 모델 한계, 해석 시 주의사항 등",
                            "model_advantages": "다른 모델 대비 이 모델이 가진 특별한 장점들"
                        },
                        "implementation_request": {
                            "model_choice": "exact_model_choice_from_enum",
                            "feature_columns": ["required_feature1", "required_feature2", ...],
                            "id_column": "exact primary key from data to identify each target"
                            // Required for supervised learning models:
                            "target_variable": "target_column_name",
                       \s
                           // Required For some models to identify each target
                           "id_column": "id_col",
                           \s
                            // Optional parameters based on model_choice:
                            "num_clusters": 3,  // For kmeans_clustering
                            "epochs": 50,       // For neural_network_regression
                            "batch_size": 10,   // For neural_network_regression
                           \s
                            // For logistic_regression with binary target creation:
                            "binary_conditions": [
                                {
                                    "column": "column_name",
                                    "operator": ">",  // >, <, ==, >=, <=, !=
                                    "value": 100000,
                                    "target_column": "new_binary_column"
                                }
                            ],
                       \s
                            // For graph_neural_network_analysis:
                            "node_features_path": "path/to/nodes.csv",
                            "edges_path": "path/to/edges.csv",
                            "manager_column": "manager_col"
                        }
                    },
                    ...
                ],
            }
            ```
                       \s
            # Guidelines
            1. Model Selection:
               - Recommend 3 most suitable models
               - Consider data characteristics and analysis goals
               - Ensure implementation_request matches exactly with server requirements
               - Always include feature_columns for all models
                       \s
            2. Parameter Specification:
               - Include all required parameters for the chosen model
               - Add optional parameters only when necessary
               - Use exact parameter names as shown in the model requirements
                       \s
            3. analysis_description:
               - Include a brief description specifying the column(s) on which the analysis will be based, detailing the type of analysis to be conducted, and anticipated outcomes.
               - Ensure each analysis description is clear, concise, and directly related to the user’s specified purpose.
                       \s
            # Constraints
            - All model_choice values must exactly match the server enum
            - feature_columns is mandatory for all models
            - Include target_variable for all supervised learning models
            - Only include model-specific optional parameters when needed
                       \s
            # Additional Output Requirements
            1. Strict JSON Compliance:
               - Must be parseable by standard JSON parsers
               - No comments in the final JSON output
               - No trailing commas
               - All string values must be in double quotes
                       \s
            2. Language and Format Preservation:
               - Original column names must be preserved exactly as input
               - Model choice enums must match exactly as specified
               - Technical parameters must remain in English
                       \s
            3. The `analysis_description` field should clarify:
               - The key columns involved in the analysis.
               - The type of analysis (e.g., clustering, regression).
               - The expected outcome (e.g., classification of employees into segments, predicting sales trends).
           """, formattedJson, analysisPurpose);
    }

    // SystemPrompt 생성 메서드
    public static String createSystemPromptForResult(Map<String, Object> selectedModelDetail) {
        return String.format("당신은 ML/DL 분석 결과를 비전문가에게 설명하는 전문가입니다. " +
            "주요 원칙: 1. 모든 설명은 비전문가도 이해할 수 있는 쉬운 용어로 제공, " +
            "2. 전문 용어 사용시 반드시 예시와 함께 설명" +
            "3. 비즈니스 관점에서의 의미와 가치를 강조" +
            "4. 실용적이고 실행 가능한 인사이트 제공" +
            "이전 분석 맥락 (분석 목적, 데이터 설명, 추천 모델 목록): %s",
             selectedModelDetail);
    }

        // UserPrompt 생성 메서드
        public static String createUserPromptForResult(Map<String, Object> fastApiResult) {
            return String.format(
                """
                # Role and Context
                You are an expert data analyst who specializes in explaining complex ML/DL analysis results to non-technical stakeholders. Your task is to create a comprehensive analysis report in Korean based on the provided machine learning analysis results.
    
                Analyze the provided results and return your analysis in the following JSON format. All explanations should be in Korean except for technical terms.
    
                # Input Data
                %s
    
                # Required Response Format:
                ```
                {
                    "overview": {
                        "analysis_purpose": "분석 목적과 배경 설명",
                        "data_description": "분석된 데이터에 대한 설명",
                        "models_used": {
                            "model_name": "사용된 모델명",
                            "model_description": "모델에 대한 평이한 설명"
                        }
                    },
                    "model_performance": {
                        "metrics": [
                            {
                                "metric_name": "성능 지표명 (예: R², MSE 등)",
                                "metric_value": "지표 값",
                                "interpretation": "지표가 의미하는 바에 대한 이해하기 쉬운 설명"
                            }
                        ],
                        "prediction_analysis": {
                            "overall_accuracy": "전반적인 예측 정확도 설명",
                            "notable_patterns": [
                                "주목할만한 패턴 1",
                                "주목할만한 패턴 2"
                            ]
                        }
                    },
                    "feature_importance": {
                        "key_features": [
                            {
                                "feature_name": "중요 특성명",
                                "importance_score": "중요도 점수 (if any else None)",
                                "business_impact": "비즈니스 관점에서 분석 목적을 달성하는데 어떤 의미를 가지는지"
                            }
                        ],
                        "relationships": [
                            {
                                "description": "특성들 간의 관계를 자세히 설명",
                                "business_insight": "이를 통해 얻을 수 있는 비즈니스 인사이트"
                            }
                        ]
                    },
                    "visualizations": [
                        {
                            "title": "시각화 제목",
                            "type": "차트 종류",
                            "description": "시각화가 보여주는 내용 설명",
                            "insights": "시각화를 통해 발견할 수 있는 인사이트"
                        }
                    ],
                    "key_findings": [
                        {
                            "finding": "주요 발견사항",
                            "impact": "비즈니스 영향",
                            "recommendation": "권장 조치사항"
                        }
                    ],
                    "recommendations": {
                        "immediate_actions": [
                            "즉시 수행 가능한 조치사항"
                        ],
                        "further_analysis": [
                            "추가 분석이 필요한 영역"
                        ]
                    }
                }
                ```
    
                # Guidelines:
                1. Language and Communication:
                   - Use simple, conversational Korean language avoiding technical jargon
                   - When technical terms must be used, provide clear explanations with everyday examples
                   - Maintain original format for technical terms, column names, and model names
                   - Write as if explaining to a friend who has no technical background
    
                2. Explanation Depth:
                   - Start with a high-level overview before diving into details
                   - Provide step-by-step explanations for complex concepts
                   - Use relatable real-world analogies and examples
                   - Include "For example, ..." sections to illustrate key points
                   - Explain both "what" the results show and "why" they matter
    
                3. Business Context:
                   - Focus on practical business implications and value
                   - Connect technical findings to business outcomes
                   - Provide actionable insights that can be implemented
                   - Explain potential business impacts in monetary or operational terms
                   - Include industry-specific examples when relevant
    
                4. Visualization and Understanding:
                   - Describe complex patterns in simple, visual terms
                   - Use everyday analogies to explain statistical concepts
                   - Suggest clear visual representations for important findings
                   - Explain what patterns or trends mean in practical terms
    
                5. Confidence and Transparency:
                   - Clearly communicate levels of certainty in findings
                   - Explain limitations and assumptions in simple terms
                   - Be honest about areas of uncertainty
                   - Provide context for statistical measures
                   - Include caveats where appropriate
    
                6. Structure and Readability:
                   - Use bullet points and numbered lists for clarity
                   - Break down complex ideas into digestible chunks
                   - Provide summary points for each section
                   - Use consistent terminology throughout
                   - Include "Key Takeaway" sections for important points
    
                7. Customer Focus:
                   - Anticipate and address potential questions
                   - Provide context for why each finding matters
                   - Include practical next steps and recommendations
                   - Use encouraging and constructive language
                   - Emphasize positive insights while being honest about challenges
    
                8. Comprehensive Support:
                   - Offer multiple perspectives on important findings
                   - Provide both short-term and long-term recommendations
                   - Include success metrics for suggested actions
                   - Suggest ways to monitor and measure progress
                   - Outline potential implementation strategies
    
                # Additional Output Requirements
    
                1. Strict JSON Compliance:
                   - Must be parseable by standard JSON parsers
                   - No comments in the final JSON output
                   - No trailing commas
                   - All string values must be in double quotes
    
                Remember: The goal is to make the customer feel informed, empowered, and confident in understanding the analysis results and their implications for their business.
    
                Your response should be a single valid JSON object following the above format, with all values provided in Korean except for technical terms.
                """, fastApiResult
            );
        }


}
