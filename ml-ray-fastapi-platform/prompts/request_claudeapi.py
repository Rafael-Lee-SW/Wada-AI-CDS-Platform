import anthropic
import json
from datetime import datetime
import os
import re

def clean_json_string(json_str):
    """Clean and format JSON string to handle line breaks and ensure valid JSON"""
    # Replace line breaks within string values
    json_str = re.sub(r'\n\s*(?=[^"]*"(?:[^"]*"[^"]*")*[^"]*$)', ' ', json_str)
    # Remove any remaining problematic whitespace
    json_str = re.sub(r'\s+(?=[^"]*"(?:[^"]*"[^"]*")*[^"]*$)', ' ', json_str)
    return json_str

def parse_and_save_response():
    # Initialize Anthropic client
    client = anthropic.Anthropic(
        api_key="your key"
    )

    # Your existing prompt (stored in variable 'prompt')
    prompt = '''
    # Role and Context
    You are an expert data scientist responsible for analyzing data and recommending the most appropriate machine learning models. Your recommendations should be directly applicable to the Ray ML server implementation.

    # Input Data
    1. Data Structure:
    ```json
        {
            "columns": [
                "Area",
                "Year",
                "Savanna fires",
                "Forest fires",
                "Crop Residues",
                "Rice Cultivation",
                "Drained organic soils (CO2)",
                "Pesticides Manufacturing",
                "Food Transport",
                "Forestland",
                "Net Forest conversion",
                "Food Household Consumption",
                "Food Retail",
                "On-farm Electricity Use",
                "Food Packaging",
                "Agrifood Systems Waste Disposal",
                "Food Processing",
                "Fertilizers Manufacturing",
                "IPPU",
                "Manure applied to Soils",
                "Manure left on Pasture",
                "Manure Management",
                "Fires in organic soils",
                "Fires in humid tropical forests",
                "On-farm energy use",
                "Rural population",
                "Urban population",
                "Total Population - Male",
                "Total Population - Female",
                "total_emission",
                "Average Temperature \u00b0C"
            ],
            "rows": [
                {
                    "Area": "Bhutan",
                    "Year": 2012,
                    "Savanna fires": 4.2117,
                    "Forest fires": 80.1618,
                    "Crop Residues": 10.015,
                    "Rice Cultivation": 68.1375,
                    "Drained organic soils (CO2)": 0.0,
                    "Pesticides Manufacturing": 0.0,
                    "Food Transport": 7.5701,
                    "Forestland": -1316.8667,
                    "Net Forest conversion": 0.0,
                    "Food Household Consumption": 25.568,
                    "Food Retail": 14.8563,
                    "On-farm Electricity Use": 0.8916,
                    "Food Packaging": 67.63136607385836,
                    "Agrifood Systems Waste Disposal": 105.8046,
                    "Food Processing": 252.2141899664796,
                    "Fertilizers Manufacturing": 4033.5122384079095,
                    "IPPU": 530.5886,
                    "Manure applied to Soils": 12.7693,
                    "Manure left on Pasture": 62.2218,
                    "Manure Management": 37.4679,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 32.7054,
                    "On-farm energy use": 11.7027,
                    "Rural population": 479102.0,
                    "Urban population": 273865.0,
                    "Total Population - Male": 383648.0,
                    "Total Population - Female": 337498.0,
                    "total_emission": 4041.163394448247,
                    "Average Temperature \u00b0C": 0.4395
                },
                {
                    "Area": "Somalia",
                    "Year": 2018,
                    "Savanna fires": 0.3369,
                    "Forest fires": 0.0,
                    "Crop Residues": 26.9878,
                    "Rice Cultivation": 4.3081,
                    "Drained organic soils (CO2)": 0.0,
                    "Pesticides Manufacturing": 11.606164948241496,
                    "Food Transport": 15.508,
                    "Forestland": 0.0,
                    "Net Forest conversion": 17352.1517,
                    "Food Household Consumption": 3.176,
                    "Food Retail": 3.042,
                    "On-farm Electricity Use": 4.8209,
                    "Food Packaging": 67.63136607385836,
                    "Agrifood Systems Waste Disposal": 1125.6633,
                    "Food Processing": 431.7032811799027,
                    "Fertilizers Manufacturing": 2499.667691924764,
                    "IPPU": 39.6288,
                    "Manure applied to Soils": 118.3599,
                    "Manure left on Pasture": 5347.7527,
                    "Manure Management": 833.2683,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 0.0,
                    "On-farm energy use": 22.5202,
                    "Rural population": 8354510.0,
                    "Urban population": 6827415.0,
                    "Total Population - Male": 7725140.0,
                    "Total Population - Female": 7685953.0,
                    "total_emission": 27908.13310412677,
                    "Average Temperature \u00b0C": 0.773
                },
                {
                    "Area": "Albania",
                    "Year": 2013,
                    "Savanna fires": 0.29,
                    "Forest fires": 0.0,
                    "Crop Residues": 40.0653,
                    "Rice Cultivation": 248.06149701135485,
                    "Drained organic soils (CO2)": 109.1577,
                    "Pesticides Manufacturing": 5.0,
                    "Food Transport": 286.2621,
                    "Forestland": -961.0391,
                    "Net Forest conversion": 0.0,
                    "Food Household Consumption": 130.6304,
                    "Food Retail": 85.9146,
                    "On-farm Electricity Use": 1.2721,
                    "Food Packaging": 31.5296,
                    "Agrifood Systems Waste Disposal": 691.7072,
                    "Food Processing": 141.9204,
                    "Fertilizers Manufacturing": 377.4078995531106,
                    "IPPU": 1416.2855,
                    "Manure applied to Soils": 203.7271,
                    "Manure left on Pasture": 343.4951,
                    "Manure Management": 483.1922,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 0.0,
                    "On-farm energy use": 266.1464,
                    "Rural population": 1302236.0,
                    "Urban population": 1616742.0,
                    "Total Population - Male": 1448110.0,
                    "Total Population - Female": 1438905.0,
                    "total_emission": 3901.0259965644655,
                    "Average Temperature \u00b0C": 1.3974166666666663
                },
                {
                    "Area": "Guyana",
                    "Year": 1992,
                    "Savanna fires": 31.6367,
                    "Forest fires": 34.7888,
                    "Crop Residues": 19.4155,
                    "Rice Cultivation": 606.7662,
                    "Drained organic soils (CO2)": 1427.401,
                    "Pesticides Manufacturing": 20.0,
                    "Food Transport": 24.6059,
                    "Forestland": 0.0,
                    "Net Forest conversion": 4015.6997,
                    "Food Household Consumption": 33.0378,
                    "Food Retail": 34.4078,
                    "On-farm Electricity Use": 5.986,
                    "Food Packaging": 67.63136607385836,
                    "Agrifood Systems Waste Disposal": 163.2517,
                    "Food Processing": 209.58772835754152,
                    "Fertilizers Manufacturing": 4374.3545732353605,
                    "IPPU": 4.5362,
                    "Manure applied to Soils": 10.2284,
                    "Manure left on Pasture": 97.9753,
                    "Manure Management": 13.25,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 33.5891,
                    "On-farm energy use": 173.0674,
                    "Rural population": 528154.0,
                    "Urban population": 219980.0,
                    "Total Population - Male": 368670.0,
                    "Total Population - Female": 376329.0,
                    "total_emission": 11401.21716766676,
                    "Average Temperature \u00b0C": 0.0771818181818182
                },
                {
                    "Area": "Armenia",
                    "Year": 2003,
                    "Savanna fires": 0.3173,
                    "Forest fires": 0.0,
                    "Crop Residues": 27.8305,
                    "Rice Cultivation": 248.06149701135485,
                    "Drained organic soils (CO2)": 0.0,
                    "Pesticides Manufacturing": 1.0,
                    "Food Transport": 112.6952,
                    "Forestland": -84.0142,
                    "Net Forest conversion": 207.196,
                    "Food Household Consumption": 100.0263,
                    "Food Retail": 132.4422,
                    "On-farm Electricity Use": 32.0006,
                    "Food Packaging": 61.5852,
                    "Agrifood Systems Waste Disposal": 386.967,
                    "Food Processing": 294.0685,
                    "Fertilizers Manufacturing": 377.4078995531106,
                    "IPPU": 524.945,
                    "Manure applied to Soils": 20.5857,
                    "Manure left on Pasture": 353.3788,
                    "Manure Management": 45.9357,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 0.0,
                    "On-farm energy use": 146.2962,
                    "Rural population": 1082281.0,
                    "Urban population": 1935525.0,
                    "Total Population - Male": 1447623.0,
                    "Total Population - Female": 1636478.0,
                    "total_emission": 2988.7253965644654,
                    "Average Temperature \u00b0C": 0.56425
                },
                {
                    "Area": "Grenada",
                    "Year": 2013,
                    "Savanna fires": 0.0,
                    "Forest fires": 0.0,
                    "Crop Residues": 0.0312,
                    "Rice Cultivation": 448.1647247296135,
                    "Drained organic soils (CO2)": 0.0,
                    "Pesticides Manufacturing": 11.481084565896976,
                    "Food Transport": 11.1244,
                    "Forestland": 0.0,
                    "Net Forest conversion": 0.0,
                    "Food Household Consumption": 16.4926,
                    "Food Retail": 17.2736,
                    "On-farm Electricity Use": 17.00466278502689,
                    "Food Packaging": 93.4827462238061,
                    "Agrifood Systems Waste Disposal": 32.5999,
                    "Food Processing": 209.58772835754152,
                    "Fertilizers Manufacturing": 658.5406035363438,
                    "IPPU": 3.8421,
                    "Manure applied to Soils": 0.8306,
                    "Manure left on Pasture": 3.9006,
                    "Manure Management": 0.9304,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 0.0,
                    "On-farm energy use": 0.0319,
                    "Rural population": 67892.0,
                    "Urban population": 38017.0,
                    "Total Population - Male": 58897.0,
                    "Total Population - Female": 58047.0,
                    "total_emission": 1525.3188501982286,
                    "Average Temperature \u00b0C": 0.7099166666666666
                },
                {
                    "Area": "Portugal",
                    "Year": 2013,
                    "Savanna fires": 65.0491,
                    "Forest fires": 25.7503,
                    "Crop Residues": 68.2497,
                    "Rice Cultivation": 425.8578,
                    "Drained organic soils (CO2)": 261.5223,
                    "Pesticides Manufacturing": 158.0,
                    "Food Transport": 1277.3897,
                    "Forestland": -1112.584,
                    "Net Forest conversion": 0.0,
                    "Food Household Consumption": 1861.4462,
                    "Food Retail": 1375.2362,
                    "On-farm Electricity Use": 266.8696,
                    "Food Packaging": 422.4287,
                    "Agrifood Systems Waste Disposal": 2828.4208,
                    "Food Processing": 1182.0915,
                    "Fertilizers Manufacturing": 444.9891,
                    "IPPU": 23683.9306,
                    "Manure applied to Soils": 487.1465,
                    "Manure left on Pasture": 464.5179,
                    "Manure Management": 1469.2914,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 0.0,
                    "On-farm energy use": 1143.8551,
                    "Rural population": 3963418.0,
                    "Urban population": 6564256.0,
                    "Total Population - Male": 4979863.0,
                    "Total Population - Female": 5484672.0,
                    "total_emission": 36799.4585,
                    "Average Temperature \u00b0C": 0.86725
                },
                {
                    "Area": "Kenya",
                    "Year": 2009,
                    "Savanna fires": 77.4016,
                    "Forest fires": 8.1459,
                    "Crop Residues": 245.712,
                    "Rice Cultivation": 42.7848,
                    "Drained organic soils (CO2)": 164.6108,
                    "Pesticides Manufacturing": 39.0,
                    "Food Transport": 394.5089,
                    "Forestland": 26.5198,
                    "Net Forest conversion": 14977.4103,
                    "Food Household Consumption": 84.7929,
                    "Food Retail": 152.0655,
                    "On-farm Electricity Use": 14.803,
                    "Food Packaging": 68.41215211031376,
                    "Agrifood Systems Waste Disposal": 6094.5965,
                    "Food Processing": 88.2538,
                    "Fertilizers Manufacturing": 356.4910168671663,
                    "IPPU": 1647.2656,
                    "Manure applied to Soils": 361.1806,
                    "Manure left on Pasture": 12001.7396,
                    "Manure Management": 1042.6188,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 0.0,
                    "On-farm energy use": 362.424,
                    "Rural population": 30909074.0,
                    "Urban population": 9328130.0,
                    "Total Population - Male": 20068349.0,
                    "Total Population - Female": 20296096.0,
                    "total_emission": 38250.73756897748,
                    "Average Temperature \u00b0C": 1.3261666666666667
                },
                {
                    "Area": "Jordan",
                    "Year": 2016,
                    "Savanna fires": 0.0,
                    "Forest fires": 0.0,
                    "Crop Residues": 8.5451,
                    "Rice Cultivation": 246.40727646443952,
                    "Drained organic soils (CO2)": 0.0,
                    "Pesticides Manufacturing": 24.0,
                    "Food Transport": 973.4701,
                    "Forestland": 0.0,
                    "Net Forest conversion": 0.0,
                    "Food Household Consumption": 1037.8434,
                    "Food Retail": 474.4895,
                    "On-farm Electricity Use": 1250.4947,
                    "Food Packaging": 39.7041,
                    "Agrifood Systems Waste Disposal": 2010.92,
                    "Food Processing": 3.5127,
                    "Fertilizers Manufacturing": 832.6207,
                    "IPPU": 2519.6874,
                    "Manure applied to Soils": 19.6369,
                    "Manure left on Pasture": 437.4672,
                    "Manure Management": 45.7852,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 0.0,
                    "On-farm energy use": 359.7245,
                    "Rural population": 897724.0,
                    "Urban population": 8558078.0,
                    "Total Population - Male": 5185852.0,
                    "Total Population - Female": 4778803.0,
                    "total_emission": 10284.308776464435,
                    "Average Temperature \u00b0C": 1.6049999999999998
                },
                {
                    "Area": "Philippines",
                    "Year": 2000,
                    "Savanna fires": 7.112,
                    "Forest fires": 71.9166,
                    "Crop Residues": 1111.7677,
                    "Rice Cultivation": 37828.0534,
                    "Drained organic soils (CO2)": 0.0,
                    "Pesticides Manufacturing": 293.0,
                    "Food Transport": 2621.0341,
                    "Forestland": -19712.1471,
                    "Net Forest conversion": 22116.248,
                    "Food Household Consumption": 2993.2273,
                    "Food Retail": 815.4225,
                    "On-farm Electricity Use": 254.9352,
                    "Food Packaging": 125.9509,
                    "Agrifood Systems Waste Disposal": 9768.2265,
                    "Food Processing": 882.5441,
                    "Fertilizers Manufacturing": 143.4192,
                    "IPPU": 9215.1471,
                    "Manure applied to Soils": 834.0331,
                    "Manure left on Pasture": 2065.1763,
                    "Manure Management": 3467.1572,
                    "Fires in organic soils": 0.0,
                    "Fires in humid tropical forests": 54.0295,
                    "On-farm energy use": 1024.2864,
                    "Rural population": 42010504.0,
                    "Urban population": 35981065.0,
                    "Total Population - Male": 39394372.0,
                    "Total Population - Female": 38563851.0,
                    "total_emission": 75980.54000000001,
                    "Average Temperature \u00b0C": 0.6835
                }
            ]
        }
    ```

    2. User's Analysis Purpose:
    "이 데이터를 통해서 제대로 된 인사이트를 뽑고 싶은데 어떻게 할까?""

    3. Available Models:
    ```
    1. random_forest_regression
        - For numerical target prediction
        - Handles both numerical and categorical features
        - Provides feature importance
        - Required: feature_columns, target_variable
        - Example: Performance score prediction, salary forecasting

    2. random_forest_classification
        - For categorical outcome prediction
        - Handles both numerical and categorical features
        - Provides feature importance
        - Required: feature_columns, target_variable
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

    4. logistic_regression_attrition
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

    2. Korean Language Style:
    - Use polite and professional language (합니다/습니다 style)
    - Provide detailed explanations that non-technical users can understand
    - Include specific examples and implications where appropriate
    - Maintain a helpful and supportive tone

    3. Content Guidelines for Korean Sections:
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
        - selection_reasoning: 
        • 모델 선택의 이유
        • 해당 모델의 장점
        • 예상되는 분석 결과
        • 실제 비즈니스 관점에서의 가치
        • 주의사항이나 고려사항
    ```

    4. Examples of Appropriate Korean Explanations:
    ```json
    "main_goal": "고객님의 매출 데이터를 활용하여 향후 3개월 간의 매출을 예측하고, 이를 통해 재고 관리 및 마케팅 전략 수립에 도움을 드리고자 합니다.",
    
    "structure_summary": "제공해 주신 데이터는 총 12개월 간의 일별 매출 기록으로, 제품별 판매량과 관련 마케팅 활동이 상세히 기록되어 있습니다. 특히 계절성이 뚜렷하게 나타나는 특징을 보이고 있습니다.",
    
    "selection_reasoning": "RandomForestRegressor 모델을 추천 드리는 주된 이유는 다음과 같습니다: 1) 고객님의 매출 데이터가 가진 계절성과 트렌드를 정확히 포착할 수 있습니다. 2) 각 변수의 중요도를 파악하여 어떤 요소가 매출에 가장 큰 영향을 미치는지 확인하실 수 있습니다. 3) 과적합 위험이 적어 안정적인 예측이 가능합니다."
    ```

    5. Response Format
    ```json
    {
        "purpose_understanding": {
            "main_goal": "Primary analysis objective",
            "specific_requirements": ["Specific analysis requirements"],
            "expected_outcomes": ["Expected insights or predictions"]
        },
        "data_overview": {
            "structure_summary": "Overview of the data structure",
            "key_characteristics": ["Important data characteristics"],
            "relevant_columns": ["Columns relevant to the analysis goal"]
        },
        "model_recommendations": [
            {
                "analysis_name": "Human readable name of the model and short description of analysis from model",
                "selection_reasoning": "Detailed justification for this model selection",
                "implementation_request": {
                    "model_choice": "exact_model_choice_from_enum",
                    "feature_columns": ["required_feature1", "required_feature2", ...],
                    
                    // Required for supervised learning models:
                    "target_variable": "target_column_name",
                    
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
                    "id_column": "id_col",
                    "manager_column": "manager_col"
                }
            }
        ]
    }
    ```

    # Guidelines
    1. Model Selection:
    - Recommend 2-3 most suitable models
    - Consider data characteristics and analysis goals
    - Ensure implementation_request matches exactly with server requirements
    - Always include feature_columns for all models

    2. Parameter Specification:
    - Include all required parameters for the chosen model
    - Add optional parameters only when necessary
    - Use exact parameter names as shown in the model requirements

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
    '''
    
    try:
        # Get response from Claude with increased max_tokens
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,  # Increased from 1024 to 4096
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Get the response content
        response_content = message.content
        
        # Handle TextBlock objects
        if isinstance(response_content, list) and len(response_content) > 0:
            # Extract text from TextBlock
            text_content = response_content[0].text
        else:
            text_content = response_content

        # Clean the JSON string
        cleaned_json_str = clean_json_string(text_content)
        
        try:
            # First attempt to parse the JSON
            response_json = json.loads(cleaned_json_str)
        except json.JSONDecodeError:
            # If parsing fails, try to fix truncated JSON
            if '"model_recommendations"' in cleaned_json_str:
                # Find the last complete model recommendation
                last_complete = cleaned_json_str.rfind('}')
                if last_complete != -1:
                    # Complete the JSON structure
                    cleaned_json_str = cleaned_json_str[:last_complete] + '}]}'
                    response_json = json.loads(cleaned_json_str)
            else:
                raise
        
        # Create filename with current timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"result_{timestamp}.json"
        
        # Save to file with proper indentation
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(response_json, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully saved response to {filename}")
        
        # Print response length information
        print(f"Response length: {len(cleaned_json_str)} characters")
        print("Last model recommendation details:")
        if 'model_recommendations' in response_json:
            print(json.dumps(response_json['model_recommendations'][-1], ensure_ascii=False, indent=2))
        
        return filename
        
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        print("Failed to parse JSON. Content length:", len(cleaned_json_str))
        print("Last 500 characters of content:")
        print(cleaned_json_str[-500:])
        return None
    except Exception as e:
        print(f"Error: {e}")
        print("Error type:", type(e))
        return None

if __name__ == "__main__":
    saved_file = parse_and_save_response()