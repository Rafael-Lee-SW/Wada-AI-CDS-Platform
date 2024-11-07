package com.ssafy.wada.client.openai;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class PromptGenerator {

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
