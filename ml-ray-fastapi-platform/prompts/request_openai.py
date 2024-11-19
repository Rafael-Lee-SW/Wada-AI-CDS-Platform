from openai import OpenAI
import json
from datetime import datetime
import re

def parse_and_save_response(prompt):
    client = OpenAI(api_key="your key")

    try:
        print("Sending request to OpenAI API...")
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-4o",
            max_tokens=4096,
            response_format={"type": "json_object"}
        )
        print("Received response from OpenAI API.")

        # Parse the JSON content from the response
        response_content = response.choices[0].message.content
        response_json = json.loads(response_content)  # Parse the JSON string
        print(response)
        print(response_json)

        # Create a timestamped filename for the JSON file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"request_{timestamp}.json"

        # Save the JSON data to a file
        print(f"Saving parsed JSON to {filename}...")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(response_json, f, ensure_ascii=False, indent=2)

        print(f"Successfully saved parsed JSON to {filename}")
        return filename

    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Your existing prompt (stored in variable 'prompt')
    prompt = '''
    # Role and Context
    You are an expert data scientist responsible for analyzing multiple CSV files and recommending the most appropriate machine learning models based on each dataset. Your recommendations should be directly applicable to the Ray ML server implementation.


    # Input Data
    1. Data Structure:
    ```json
    [
        {
            "file_name": "Human_Resources_Data_Set.csv",
            "columns": [
                "Employee\u005fName",
                "EmpID",
                "MarriedID",
                "MaritalStatusID",
                "GenderID",
                "EmpStatusID",
                "DeptID",
                "PerfScoreID",
                "FromDiversityJobFairID",
                "Salary",
                "Termd",
                "PositionID",
                "Position",
                "State",
                "Zip",
                "DOB",
                "Sex",
                "MaritalDesc",
                "CitizenDesc",
                "HispanicLatino",
                "RaceDesc",
                "DateofHire",
                "DateofTermination",
                "TermReason",
                "EmploymentStatus",
                "Department",
                "ManagerName",
                "ManagerID",
                "RecruitmentSource",
                "PerformanceScore",
                "EngagementSurvey",
                "EmpSatisfaction",
                "SpecialProjectsCount",
                "LastPerformanceReview\u005fDate",
                "DaysLateLast30",
                "Absences",
                "TenureDays"
            ],
            "random_10_rows": [
                {
                    "Employee\u005fName": "Gonzalez, Cayo",
                    "EmpID": 10031,
                    "MarriedID": 0,
                    "MaritalStatusID": 2,
                    "GenderID": 1,
                    "EmpStatusID": 1,
                    "DeptID": 5,
                    "PerfScoreID": 4,
                    "FromDiversityJobFairID": 1,
                    "Salary": 59892,
                    "Termd": 0,
                    "PositionID": 19,
                    "Position": "Production Technician I",
                    "State": "MA",
                    "Zip": 2108,
                    "DOB": "09/29/69",
                    "Sex": "M ",
                    "MaritalDesc": "Divorced",
                    "CitizenDesc": "US Citizen",
                    "HispanicLatino": "No",
                    "RaceDesc": "Black or African American",
                    "DateofHire": "2011-07-11",
                    "DateofTermination": NaN,
                    "TermReason": "N/A-StillEmployed",
                    "EmploymentStatus": "Active",
                    "Department": "Production       ",
                    "ManagerName": "Brannon Miller",
                    "ManagerID": 12.0,
                    "RecruitmentSource": "Diversity Job Fair",
                    "PerformanceScore": "Exceeds",
                    "EngagementSurvey": 4.5,
                    "EmpSatisfaction": 4,
                    "SpecialProjectsCount": 0,
                    "LastPerformanceReview\u005fDate": "2/18/2019",
                    "DaysLateLast30": 0,
                    "Absences": 1,
                    "TenureDays": NaN
                },
                {
                    "Employee\u005fName": "Smith, Sade",
                    "EmpID": 10157,
                    "MarriedID": 0,
                    "MaritalStatusID": 0,
                    "GenderID": 0,
                    "EmpStatusID": 1,
                    "DeptID": 5,
                    "PerfScoreID": 3,
                    "FromDiversityJobFairID": 0,
                    "Salary": 58939,
                    "Termd": 0,
                    "PositionID": 19,
                    "Position": "Production Technician I",
                    "State": "MA",
                    "Zip": 2130,
                    "DOB": "02/02/65",
                    "Sex": "F",
                    "MaritalDesc": "Single",
                    "CitizenDesc": "US Citizen",
                    "HispanicLatino": "No",
                    "RaceDesc": "White",
                    "DateofHire": "2013-11-11",
                    "DateofTermination": NaN,
                    "TermReason": "N/A-StillEmployed",
                    "EmploymentStatus": "Active",
                    "Department": "Production       ",
                    "ManagerName": "Ketsia Liebig",
                    "ManagerID": 19.0,
                    "RecruitmentSource": "Employee Referral",
                    "PerformanceScore": "Fully Meets",
                    "EngagementSurvey": 3.73,
                    "EmpSatisfaction": 3,
                    "SpecialProjectsCount": 0,
                    "LastPerformanceReview\u005fDate": "1/24/2019",
                    "DaysLateLast30": 0,
                    "Absences": 16,
                    "TenureDays": NaN
                },
                {
                    "Employee\u005fName": "Galia, Lisa",
                    "EmpID": 10273,
                    "MarriedID": 0,
                    "MaritalStatusID": 0,
                    "GenderID": 0,
                    "EmpStatusID": 1,
                    "DeptID": 3,
                    "PerfScoreID": 3,
                    "FromDiversityJobFairID": 0,
                    "Salary": 65707,
                    "Termd": 0,
                    "PositionID": 14,
                    "Position": "IT Support",
                    "State": "CT",
                    "Zip": 6040,
                    "DOB": "07/06/68",
                    "Sex": "F",
                    "MaritalDesc": "Single",
                    "CitizenDesc": "US Citizen",
                    "HispanicLatino": "No",
                    "RaceDesc": "White",
                    "DateofHire": "2010-05-01",
                    "DateofTermination": NaN,
                    "TermReason": "N/A-StillEmployed",
                    "EmploymentStatus": "Active",
                    "Department": "IT/IS",
                    "ManagerName": "Eric Dougall",
                    "ManagerID": 6.0,
                    "RecruitmentSource": "LinkedIn",
                    "PerformanceScore": "Fully Meets",
                    "EngagementSurvey": 4.7,
                    "EmpSatisfaction": 4,
                    "SpecialProjectsCount": 5,
                    "LastPerformanceReview\u005fDate": "2/1/2019",
                    "DaysLateLast30": 0,
                    "Absences": 1,
                    "TenureDays": NaN
                },
                {
                    "Employee\u005fName": "Johnson, George",
                    "EmpID": 10034,
                    "MarriedID": 1,
                    "MaritalStatusID": 1,
                    "GenderID": 1,
                    "EmpStatusID": 5,
                    "DeptID": 5,
                    "PerfScoreID": 4,
                    "FromDiversityJobFairID": 0,
                    "Salary": 46837,
                    "Termd": 1,
                    "PositionID": 19,
                    "Position": "Production Technician I",
                    "State": "MA",
                    "Zip": 2445,
                    "DOB": "08/19/59",
                    "Sex": "M ",
                    "MaritalDesc": "Married",
                    "CitizenDesc": "US Citizen",
                    "HispanicLatino": "No",
                    "RaceDesc": "White",
                    "DateofHire": "2011-11-07",
                    "DateofTermination": "2018-04-29",
                    "TermReason": "more money",
                    "EmploymentStatus": "Voluntarily Terminated",
                    "Department": "Production       ",
                    "ManagerName": "Michael Albert",
                    "ManagerID": 22.0,
                    "RecruitmentSource": "CareerBuilder",
                    "PerformanceScore": "Exceeds",
                    "EngagementSurvey": 4.7,
                    "EmpSatisfaction": 4,
                    "SpecialProjectsCount": 0,
                    "LastPerformanceReview\u005fDate": "2/14/2018",
                    "DaysLateLast30": 0,
                    "Absences": 9,
                    "TenureDays": 2365.0
                },
                {
                    "Employee\u005fName": "Gentry, Mildred",
                    "EmpID": 10159,
                    "MarriedID": 1,
                    "MaritalStatusID": 1,
                    "GenderID": 0,
                    "EmpStatusID": 1,
                    "DeptID": 5,
                    "PerfScoreID": 3,
                    "FromDiversityJobFairID": 0,
                    "Salary": 51337,
                    "Termd": 0,
                    "PositionID": 19,
                    "Position": "Production Technician I",
                    "State": "MA",
                    "Zip": 2145,
                    "DOB": "10/01/90",
                    "Sex": "F",
                    "MaritalDesc": "Married",
                    "CitizenDesc": "US Citizen",
                    "HispanicLatino": "No",
                    "RaceDesc": "Black or African American",
                    "DateofHire": "2015-03-30",
                    "DateofTermination": NaN,
                    "TermReason": "N/A-StillEmployed",
                    "EmploymentStatus": "Active",
                    "Department": "Production       ",
                    "ManagerName": "Michael Albert",
                    "ManagerID": 22.0,
                    "RecruitmentSource": "LinkedIn",
                    "PerformanceScore": "Fully Meets",
                    "EngagementSurvey": 3.73,
                    "EmpSatisfaction": 3,
                    "SpecialProjectsCount": 0,
                    "LastPerformanceReview\u005fDate": "1/16/2019",
                    "DaysLateLast30": 0,
                    "Absences": 19,
                    "TenureDays": NaN
                }
            ]
        },
        {
            "file_name": "Simulated_Factory_Impact_Data.csv",
            "columns": [
                "Employee ID",
                "Factory Operating Rate \u0028\u0025\u0029",
                "Production Volume \u0028units\u0029",
                "Production Efficiency \u0028\u0025\u0029",
                "Production Downtime Rate \u0028\u0025\u0029",
                "Role Criticality Score",
                "Absence Impact on Volume \u0028units\u0029",
                "Absence Impact on Efficiency \u0028\u0025\u0029",
                "Overtime Dependency Rate \u0028\u0025\u0029",
                "Maintenance Requirement Increase",
                "Cross\u002dTraining Index",
                "Error Rate Increase \u0028\u0025\u0029",
                "Process Bottleneck Potential \u0028\u0025\u0029",
                "Team Coordination Score",
                "Job Role Coverage \u0028\u0025\u0029",
                "Absenteeism Frequency",
                "Shift Flexibility Score",
                "Operational Risk Factor",
                "Skill Redundancy Level",
                "Absence Cost Impact \u0028\u0024\u0029"
            ],
            "random_10_rows": [
                {
                    "Employee ID": 10293,
                    "Factory Operating Rate \u0028\u0025\u0029": 83.24,
                    "Production Volume \u0028units\u0029": 4811,
                    "Production Efficiency \u0028\u0025\u0029": 89.69,
                    "Production Downtime Rate \u0028\u0025\u0029": 5.25,
                    "Role Criticality Score": 5,
                    "Absence Impact on Volume \u0028units\u0029": 313,
                    "Absence Impact on Efficiency \u0028\u0025\u0029": 4.14,
                    "Overtime Dependency Rate \u0028\u0025\u0029": 17.4,
                    "Maintenance Requirement Increase": 1,
                    "Cross\u002dTraining Index": 0,
                    "Error Rate Increase \u0028\u0025\u0029": 2.52,
                    "Process Bottleneck Potential \u0028\u0025\u0029": 3.46,
                    "Team Coordination Score": 5,
                    "Job Role Coverage \u0028\u0025\u0029": 15.73,
                    "Absenteeism Frequency": 15,
                    "Shift Flexibility Score": 2,
                    "Operational Risk Factor": 0.93,
                    "Skill Redundancy Level": 1,
                    "Absence Cost Impact \u0028\u0024\u0029": 4061.44
                },
                {
                    "Employee ID": 10276,
                    "Factory Operating Rate \u0028\u0025\u0029": 81.0,
                    "Production Volume \u0028units\u0029": 1560,
                    "Production Efficiency \u0028\u0025\u0029": 78.36,
                    "Production Downtime Rate \u0028\u0025\u0029": 16.43,
                    "Role Criticality Score": 1,
                    "Absence Impact on Volume \u0028units\u0029": 327,
                    "Absence Impact on Efficiency \u0028\u0025\u0029": 2.85,
                    "Overtime Dependency Rate \u0028\u0025\u0029": 18.6,
                    "Maintenance Requirement Increase": 4,
                    "Cross\u002dTraining Index": 0,
                    "Error Rate Increase \u0028\u0025\u0029": 1.04,
                    "Process Bottleneck Potential \u0028\u0025\u0029": 2.8,
                    "Team Coordination Score": 2,
                    "Job Role Coverage \u0028\u0025\u0029": 75.4,
                    "Absenteeism Frequency": 6,
                    "Shift Flexibility Score": 4,
                    "Operational Risk Factor": 0.55,
                    "Skill Redundancy Level": 4,
                    "Absence Cost Impact \u0028\u0024\u0029": 1821.02
                },
                {
                    "Employee ID": 10004,
                    "Factory Operating Rate \u0028\u0025\u0029": 90.62,
                    "Production Volume \u0028units\u0029": 1516,
                    "Production Efficiency \u0028\u0025\u0029": 63.36,
                    "Production Downtime Rate \u0028\u0025\u0029": 14.54,
                    "Role Criticality Score": 4,
                    "Absence Impact on Volume \u0028units\u0029": 467,
                    "Absence Impact on Efficiency \u0028\u0025\u0029": 6.34,
                    "Overtime Dependency Rate \u0028\u0025\u0029": 9.6,
                    "Maintenance Requirement Increase": 4,
                    "Cross\u002dTraining Index": 1,
                    "Error Rate Increase \u0028\u0025\u0029": 4.67,
                    "Process Bottleneck Potential \u0028\u0025\u0029": 9.54,
                    "Team Coordination Score": 1,
                    "Job Role Coverage \u0028\u0025\u0029": 83.52,
                    "Absenteeism Frequency": 15,
                    "Shift Flexibility Score": 3,
                    "Operational Risk Factor": 0.91,
                    "Skill Redundancy Level": 1,
                    "Absence Cost Impact \u0028\u0024\u0029": 1147.4
                },
                {
                    "Employee ID": 10183,
                    "Factory Operating Rate \u0028\u0025\u0029": 98.49,
                    "Production Volume \u0028units\u0029": 1719,
                    "Production Efficiency \u0028\u0025\u0029": 93.81,
                    "Production Downtime Rate \u0028\u0025\u0029": 8.22,
                    "Role Criticality Score": 2,
                    "Absence Impact on Volume \u0028units\u0029": 352,
                    "Absence Impact on Efficiency \u0028\u0025\u0029": 1.17,
                    "Overtime Dependency Rate \u0028\u0025\u0029": 19.35,
                    "Maintenance Requirement Increase": 4,
                    "Cross\u002dTraining Index": 0,
                    "Error Rate Increase \u0028\u0025\u0029": 3.41,
                    "Process Bottleneck Potential \u0028\u0025\u0029": 1.85,
                    "Team Coordination Score": 2,
                    "Job Role Coverage \u0028\u0025\u0029": 9.52,
                    "Absenteeism Frequency": 19,
                    "Shift Flexibility Score": 3,
                    "Operational Risk Factor": 0.75,
                    "Skill Redundancy Level": 4,
                    "Absence Cost Impact \u0028\u0024\u0029": 3783.71
                },
                {
                    "Employee ID": 10225,
                    "Factory Operating Rate \u0028\u0025\u0029": 82.43,
                    "Production Volume \u0028units\u0029": 4112,
                    "Production Efficiency \u0028\u0025\u0029": 62.84,
                    "Production Downtime Rate \u0028\u0025\u0029": 8.64,
                    "Role Criticality Score": 9,
                    "Absence Impact on Volume \u0028units\u0029": 452,
                    "Absence Impact on Efficiency \u0028\u0025\u0029": 3.02,
                    "Overtime Dependency Rate \u0028\u0025\u0029": 24.39,
                    "Maintenance Requirement Increase": 2,
                    "Cross\u002dTraining Index": 1,
                    "Error Rate Increase \u0028\u0025\u0029": 2.68,
                    "Process Bottleneck Potential \u0028\u0025\u0029": 5.42,
                    "Team Coordination Score": 2,
                    "Job Role Coverage \u0028\u0025\u0029": 36.56,
                    "Absenteeism Frequency": 6,
                    "Shift Flexibility Score": 2,
                    "Operational Risk Factor": 0.12,
                    "Skill Redundancy Level": 1,
                    "Absence Cost Impact \u0028\u0024\u0029": 2173.45
                }
            ]
        }
    ]
    ```

    2. User's Analysis Purpose:
    "인원을 20% 감축해야하는데, 2가지 데이터가 있어. 어떤 파일을 기반으로 어떤 분석을 통해서 감축 인원을 정할 수 있을까?"

    3. Available Models:
    ```
    1. random_forest_regression
        - For numerical target prediction
        - Handles both numerical and categorical features
        - Provides feature importance
        - Required: feature_columns, target_variable, id_column
        - Example: Performance score prediction, salary forecasting

    2. random_forest_classification
        - For categorical outcome prediction
        - Handles both numerical and categorical features
        - Provides feature importance
        - Required: feature_columns, target_variable, id_column
        - Example: Employee termination prediction

    3. logistic_regression_binary
        - For binary classification with custom conditions
        - Highly interpretable results
        - Provides probability scores
        - Required: feature_columns, target_variable
        - Optional: binary_conditions[{
            column, operator, value, target_column
        }]
        - Example: Overpaid employee identification

    4. logistic_regression_multinomial
        - For attrition risk prediction
        - Highly interpretable results
        - Provides probability scores
        - Required: feature_columns, target_variable
        - Example: Employee attrition risk prediction

    5. kmeans_clustering_segmentation
        - For identifying employee segments
        - Unsupervised learning
        - Pattern discovery
        - Required: feature_columns
        - Optional: num_clusters(default=3)
        - Example: Employee segmentation analysis

    6. kmeans_clustering_anomaly_detection
        - For detecting unusual patterns
        - Unsupervised learning
        - Anomaly discovery
        - Required: feature_columns
        - Optional: num_clusters(default=3), threshold
        - Example: Unusual behavior pattern detection

    7. neural_network_regression
        - For complex regression tasks
        - Handles non-linear relationships
        - Requires sufficient data volume
        - Required: feature_columns, target_variable
        - Optional: epochs(default=100), batch_size(default=20)
        - Example: Performance score prediction

    8. graph_neural_network_analysis
        - For analyzing network relationships
        - Identifies complex patterns
        - Network structure analysis
        - Required: 
            - node_features_path
            - edges_path
            - id_column
            - edge_source_column
            - edge_target_column
        - Optional: 
            - additional_features
            - feature_generations[{
                type: "period",
                new_column: string,
                start_column: string,
                end_column: string
            }]
        - Example: Organizational network analysis
    ```

    # Response Format and Style Guidelines
    1. Format Requirements:
    - Response must be in valid JSON format only
    - No additional text or explanations outside the JSON structure
    - All JSON fields must be present exactly as specified

    2. Unicode Conversion:
    - In the implementation_request section ONLY: Retain any special characters (e.g., %, $, °C) in their Unicode escape sequences as provided in the input. For example, represent % as \u0025, $ as \u0024, and °C as \u00b0C.
    - In all other sections: Convert any Unicode escape sequences back to their original characters. For example, display \u0025 as %, \u0024 as $.

    3. Korean Language Style:
    - Use polite and professional language (합니다/습니다 style)
    - Provide detailed explanations that non-technical users can understand
    - Include specific examples and implications where appropriate
    - Maintain a helpful and supportive tone

    4. Content Guidelines for Korean Sections:
    ```
    purpose_understanding:
        - main_goal: 분석의 궁극적인 목표를 구체적으로 설명
        - specific_requirements: 각 요구사항을 단계별로 상세히 설명
        - expected_outcomes: 기대되는 결과와 그 활용방안을 자세히 기술

    data_overview:
        - structure_summary: 데이터의 전반적인 구조와 특징을 종합적으로 설명
        - key_characteristics: 중요한 데이터 특성을 bullet point로 명확하게 나열
        - relevant_columns: 각 칼럼이 분석에 어떻게 기여하는지 설명

    model_recommendations:
        - analysis_name: 선택한 모델의 이름, 역할과 분석을 통해 달성하려는 목적
        - analysis_description: 각 추천 모델에 대한 분석 설명 (기준이 되는 칼럼, 모델의 상세 분석 방식, 예상 결과 포함)
        - selection_reasoning: 
        • 모델 선택의 이유
        • 해당 모델의 장점
        • 예상되는 분석 결과
        • 실제 비즈니스 관점에서의 가치
        • 주의사항이나 고려사항
    ```

    5. Examples of Appropriate Korean Explanations:
    ```json
    "main_goal": "고객님의 매출 데이터를 활용하여 향후 3개월 간의 매출을 예측하고, 이를 통해 재고 관리 및 마케팅 전략 수립에 도움을 드리고자 합니다.",
    
    "structure_summary": "제공해 주신 데이터는 총 12개월 간의 일별 매출 기록으로, 제품별 판매량과 관련 마케팅 활동이 상세히 기록되어 있습니다. 특히 계절성이 뚜렷하게 나타나는 특징을 보이고 있습니다.",
    
    "selection_reasoning": "RandomForestRegressor 모델을 추천 드리는 주된 이유는 다음과 같습니다: 1) 고객님의 매출 데이터가 가진 계절성과 트렌드를 정확히 포착할 수 있습니다. 2) 각 변수의 중요도를 파악하여 어떤 요소가 매출에 가장 큰 영향을 미치는지 확인하실 수 있습니다. 3) 과적합 위험이 적어 안정적인 예측이 가능합니다."
    ```

    6. Response Format
    ```json
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
                "analysis_description": "Explanation of the analysis criteria, methodology, and expected outcomes based on specific columns.",
                "selection_reasoning": "Detailed justification for this model selection",
                "implementation_request": {
                    "model_choice": "exact_model_choice_from_enum",
                    "feature_columns": ["required_feature1", "required_feature2", ...],
                    "id_column": "exact primary key from data to identify each target"
                    
                    // Required for supervised learning models:
                    "target_variable": "target_column_name",

                // Required For some models to identify each target
                "id_column": "id_col",
                    
                    // Optional parameters based on model_choice:
                    "num_clusters": 3,  // For kmeans_clustering
                    "epochs": 50,       // For neural_network_regression
                    "batch_size": 10,   // For neural_network_regression
                    
                    // For logistic_regression with binary target creation:
                    "binary_conditions": [
                        {
                            "column": "column_name",
                            "operator": ">",  // >, <, ==, >=, <=, !=
                            "value": 100000,
                            "target_column": "new_binary_column"
                        }
                    ],

                    // For graph_neural_network_analysis:
                    "node_features_path": "path/to/nodes.csv",
                    "edges_path": "path/to/edges.csv",
                    "manager_column": "manager_col"
                }
            },
            ...
        ]
    }

    ```

    # Guidelines
    1. Model Selection:
    - Recommend 3 most suitable models
    - Consider data characteristics and analysis goals
    - Ensure implementation_request matches exactly with server requirements
    - Always include feature_columns for all models

    2. Parameter Specification:
    - Include all required parameters for the chosen model
    - Add optional parameters only when necessary
    - Use exact parameter names as shown in the model requirements

    3. analysis_description:
    - Include a brief description specifying the column(s) on which the analysis will be based, detailing the type of analysis to be conducted, and anticipated outcomes.
    - Ensure each analysis description is clear, concise, and directly related to the user’s specified purpose.

    # Constraints
    - All model_choice values must exactly match the server enum
    - feature_columns is mandatory for all models
    - Include target_variable for all supervised learning models
    - Only include model-specific optional parameters when needed

    # Additional Output Requirements
    1. Strict JSON Compliance:
    - Must be parseable by standard JSON parsers
    - No comments in the final JSON output
    - No trailing commas
    - All string values must be in double quotes

    2. Language and Format Preservation:
    - Original column names must be preserved exactly as input
    - Model choice enums must match exactly as specified
    - Technical parameters must remain in English

    3. The `analysis_description` field should clarify:
    - The key columns involved in the analysis.
    - The type of analysis (e.g., clustering, regression).
    - The expected outcome (e.g., classification of employees into segments, predicting sales trends).

    # Response Format Adjustments
    1. **Unicode Conversion**:
   - In the `implementation_request` section, **retain all special characters in Unicode escape sequences** as provided in the input (e.g., `%` as `\u0025`, `$` as `\u0024`).
   - In **all other sections**, convert any Unicode escape sequences back to their **original characters**. For instance, convert `\u0025` back to `%`, `\u0024` to `$`, etc.

    '''
    saved_file = parse_and_save_response(prompt)