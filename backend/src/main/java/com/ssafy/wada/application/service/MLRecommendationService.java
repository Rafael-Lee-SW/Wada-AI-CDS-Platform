package com.ssafy.wada.application.service;

import static com.ssafy.wada.application.domain.AttachedFile.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.ssafy.wada.application.domain.ChatRoom;
import com.ssafy.wada.application.domain.CsvResult;
import com.ssafy.wada.application.domain.Guest;
import com.ssafy.wada.application.repository.ChatRoomRepository;
import com.ssafy.wada.application.repository.GuestRepository;
import com.ssafy.wada.client.openai.GptClient;
import com.ssafy.wada.client.openai.GptRequest;
import com.ssafy.wada.client.s3.S3Client;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.FileErrorCode;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MLRecommendationService {

	private static final int RANDOM_SELECT_ROWS = 20;

	private final CsvParsingService csvParsingService;
	private final GuestRepository guestRepository;
	private final ChatRoomRepository chatRoomRepository;
	private final ObjectMapper objectMapper;
	private final GptClient gptClient;
	private final S3Client s3Client;

	@Value("${openai.api.key}")
	private String apiKey;

	@Transactional
	public String recommend(String sessionId, String chatRoomId, String analysisPurpose, MultipartFile file) {
		Guest guest = guestRepository.findById(sessionId)
			.orElseGet(() -> guestRepository.save(Guest.create(sessionId)));

		ChatRoom chatRoom = chatRoomRepository.findByIdAndGuestId(chatRoomId, guest.getId())
			.orElseGet(() -> chatRoomRepository.save(ChatRoom.create(chatRoomId, guest)));

		CompletableFuture.supplyAsync(() -> s3Client.upload(toAttachedFile(file)));

		CsvResult csvResult = csvParsingService.parse(file);
		String[] headers = csvResult.headers();
		List<String[]> rows = csvResult.rows();
		List<String[]> randomRows = getRandomRows(rows, RANDOM_SELECT_ROWS);
		String jsonData = convertToJson(headers, randomRows);

		log.info("rows {} ", Arrays.toString(headers));
		log.info("randomRows {} ", jsonData);
		String header = "Bearer " + apiKey;

		String body = String.format("""
			# Role and Context
			You are an expert data scientist responsible for analyzing data and recommending the most appropriate machine learning models. Your recommendations should be directly applicable to the Ray ML server implementation.

			# Input Data
			   {
			     "columns": %s,
			     "random_10_rows": %s
			   }

			2. User's Analysis Purpose:
			   %s

			3. Available Models:
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
			     - selection_reasoning:\s
			       • 모델 선택의 이유
			       • 해당 모델의 장점
			       • 예상되는 분석 결과
			       • 실제 비즈니스 관점에서의 가치
			       • 주의사항이나 고려사항

			4. Examples of Appropriate Korean Explanations:
			   "main_goal": "고객님의 매출 데이터를 활용하여 향후 3개월 간의 매출을 예측하고, 이를 통해 재고 관리 및 마케팅 전략 수립에 도움을 드리고자 합니다.",
			  \s
			   "structure_summary": "제공해 주신 데이터는 총 12개월 간의 일별 매출 기록으로, 제품별 판매량과 관련 마케팅 활동이 상세히 기록되어 있습니다. 특히 계절성이 뚜렷하게 나타나는 특징을 보이고 있습니다.",
			  \s
			   "selection_reasoning": "RandomForestRegressor 모델을 추천 드리는 주된 이유는 다음과 같습니다: 1) 고객님의 매출 데이터가 가진 계절성과 트렌드를 정확히 포착할 수 있습니다. 2) 각 변수의 중요도를 파악하여 어떤 요소가 매출에 가장 큰 영향을 미치는지 확인하실 수 있습니다. 3) 과적합 위험이 적어 안정적인 예측이 가능합니다."

			5. Response Format
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
			               \s
			                // Required for supervised learning models:
			                "target_variable": "target_column_name",
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

			                // For graph_neural_network_analysis:
			                "node_features_path": "path/to/nodes.csv",
			                "edges_path": "path/to/edges.csv",
			                "id_column": "id_col",
			                "manager_column": "manager_col"
			            }
			        }
			    ]
			}

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
""", Arrays.toString(headers), jsonData, analysisPurpose);
		GptRequest.Message message = GptRequest.Message.roleUserMessage(body);
		GptRequest request = new GptRequest(List.of(message));
		String s = gptClient.callFunction(header, request);
		return createResponse(s);
	}

	private List<String[]> getRandomRows(List<String[]> rows, int n) {
		Collections.shuffle(rows);
		return rows.stream().limit(n).collect(Collectors.toList());
	}

	private String convertToJson(String[] headers, List<String[]> rows) {
		try {
			List<Map<String, String>> result = new ArrayList<>();

			for (String[] row : rows) {
				Map<String, String> rowMap = new HashMap<>();
				for (int i = 0; i < headers.length; i++) {
					rowMap.put(headers[i], row[i]);
				}
				result.add(rowMap);
			}
			return objectMapper.writeValueAsString(result);
		} catch (JsonProcessingException e) {
			throw new BusinessException(FileErrorCode.JSON_PROCESSING_ERROR);
		}
	}

	private String createResponse(String jsonResponse) {
		log.info("jsonResponse " + jsonResponse);
		try {
			ObjectMapper mapper = new ObjectMapper();

			// 전체 JSON 응답을 Java 객체로 파싱
			JsonNode rootNode = mapper.readTree(jsonResponse);

			// `message.content`에서 JSON 문자열 추출
			String messageContent = rootNode.get("choices").get(0).get("message").get("content").asText();
			log.info("message: " + messageContent);
			JsonNode jsonNode = mapper.readTree(messageContent);

			// 예쁘게 포맷된 JSON 문자열로 변환
			ObjectWriter writer = mapper.writerWithDefaultPrettyPrinter();
			String formattedJson = writer.writeValueAsString(jsonNode);

			// 결과 출력
			return formattedJson;
		} catch (Exception e) {
			log.error("parse error");
			e.printStackTrace();
		}
		return null;
	}
}
