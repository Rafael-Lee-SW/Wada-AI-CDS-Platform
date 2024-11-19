
---
### **프로젝트 트리**
```
ml-ray-fastapi-platform
├─ .gitignore
├─ app
│  ├─ main.py
│  ├─ models_deployments.py
│  ├─ schemas.py
│  └─ __init__.py
├─ dataset
│  ├─ Agrofood_co2_emission.csv
│  ├─ edges.csv
│  ├─ Human_Resources_Data_Set.csv
│  ├─ 대전광역시 서구_둔산도서관 보유도서 목록_20210907.csv
│  └─ node_features.csv
├─ generate_graph_data.py
├─ models
│  ├─ graph_neural_network.py
│  ├─ kmeans.py
│  ├─ logistic_regression.py
│  ├─ support_vector_machine.py
│  ├─ neural_network.py
│  ├─ random_forest.py
│  └─ __init__.py
├─ plots
│  ├─ binary_logistic_regression_plot.png
│  └─ multinomial_logistic_regression_plot.png
├─ README.md
├─ requirements.txt
├─ scripts
│  ├─ run_tests.py
│  ├─ test_config.yaml
│  ├─ test_config_Agrofood.yaml
│  └─ test_config_soowan_1.yaml
├─ tree_visualizations
│  └─ tree_0.png
├─ utils.py
├─ visualization_case1.py
└─ visualization_case2.py

```

---

## **1. `.gitignore`**

- **설명:**
  - Git이 버전 관리에서 무시해야 할 파일이나 디렉토리를 지정하는 파일입니다.
  - 일반적으로 가상 환경 디렉토리(`venv/`), 캐시 파일, 로그 파일, 민감한 정보가 포함된 파일 등을 제외합니다.
  - 예시:
    ```
    __pycache__/
    *.pyc
    venv/
    .DS_Store
    *.log
    ```

## **2. `dataset/` 디렉토리**

- **설명:**
  - 머신러닝 모델 학습 및 분석에 사용되는 원시 데이터 파일들이 저장되는 디렉토리입니다.
  - **파일 목록:**
  
    ### **a. `edges.csv`**
    - **설명:**
      - 그래프 데이터의 엣지(연결) 정보를 담고 있는 CSV 파일입니다.
      - 노드 간의 관계를 나타내며, 예를 들어 소셜 네트워크에서 사용자 간의 연결을 표현할 수 있습니다.
      - **주요 열:**
        - `source`: 연결의 시작 노드 ID.
        - `target`: 연결의 끝 노드 ID.
        - `weight`: 연결의 가중치 (선택 사항).
    
    ### **b. `Human_Resources_Data_Set.csv`**
    - **설명:**
      - 인사 관리에 관련된 다양한 직원 데이터를 포함한 주요 데이터셋입니다.
      - **주요 열:**
        - `EmployeeID`: 직원 고유 식별자.
        - `Age`: 직원의 나이.
        - `Salary`: 직원의 급여.
        - `TenureDays`: 직원의 근속 일수.
        - `Department`: 직원이 속한 부서.
        - 기타 인사 관련 속성들.
    
    ### **c. `node_features.csv`**
    - **설명:**
      - 그래프 네트워크의 각 노드에 대한 특징(feature) 정보를 담은 CSV 파일입니다.
      - **주요 열:**
        - `NodeID`: 노드 고유 식별자.
        - `Feature1`, `Feature2`, ...: 각 노드의 다양한 특징값들.
      - **용도:**
        - 그래프 신경망(GNN) 모델 학습 시 노드의 속성을 입력으로 사용.
  
## **3. `generate_graph_data.py`**

- **설명:**
  - 그래프 데이터를 생성하거나 전처리하는 스크립트입니다.
  - **주요 기능:**
    - `edges.csv`와 `node_features.csv`를 기반으로 그래프 구조를 생성.
    - 데이터 정제 및 변환 작업 수행.
    - 그래프 분석을 위한 추가적인 피처 생성.
  - **사용 예시:**
    ```bash
    python generate_graph_data.py --input_edges dataset/edges.csv --input_features dataset/node_features.csv --output_graph result/graph_data.json
    ```

## **4. `log/` 디렉토리**

- **설명:**
  - 애플리케이션 실행 시 발생하는 로그 파일들이 저장되는 디렉토리입니다.
  - **파일 목록:**
  
    ### **a. `2024-10-29-test-log`**
    - **설명:**
      - 특정 테스트 실행일(2024-10-29)에 생성된 로그 파일입니다.
      - **내용:**
        - 모델 실행 과정에서의 정보, 경고, 오류 메시지 등이 포함됩니다.
        - 예시 로그:
          ```
          2024-10-29 17:39:53,415 - WARNING - TensorFlow oneDNN 최적화가 활성화되었습니다...
          2024-10-29 17:39:57,402 - INFO - K-Means 클러스터링 테스트 케이스 실행 중...
          ```

## **5. `main.py`**

- **설명:**
  - 애플리케이션의 진입점(entry point)으로, 커맨드 라인 인자(command-line arguments)를 처리하고 모델 실행을 조율합니다.
  - **주요 기능:**
    - 사용자로부터 입력받은 인자를 파싱.
    - 선택된 모델에 따라 적절한 함수 호출.
    - 결과 저장 및 로그 기록.
  - **사용 예시:**
    ```bash
    python main.py --file_path ./dataset/Human_Resources_Data_Set.csv --model_choice kmeans_clustering_segmentation --feature_columns Salary TenureDays Department --num_clusters 3
    ```

## **6. `models/` 패키지**

- **설명:**
  - 다양한 머신러닝 모델과 관련된 모듈들이 포함된 패키지입니다.
  - **파일 목록:**
  
    ### **a. `__init__.py`**
    - **설명:**
      - `models` 디렉토리를 파이썬 패키지로 인식하게 하는 파일입니다.
      - 패키지 내 모듈들을 임포트할 때 사용됩니다.
    
    ### **b. `random_forest.py`**
    - **설명:**
      - 랜덤 포레스트(Random Forest) 회귀 및 분류 함수를 포함하는 모듈입니다.
      - **주요 함수:**
        - `random_forest_classification()`: 랜덤 포레스트 분류 모델 학습 및 평가.
        - `random_forest_regression()`: 랜덤 포레스트 회귀 모델 학습 및 평가.
    
    ### **c. `kmeans.py`**
    - **설명:**
      - K-Means 클러스터링 관련 함수들을 포함하는 모듈입니다.
      - **주요 함수:**
        - `kmeans_clustering_employee_segmentation()`: 직원 세분화를 위한 K-Means 클러스터링.
        - `kmeans_clustering_redundant_roles()`: 중복 역할 식별을 위한 K-Means 클러스터링.
        - `kmeans_clustering_anomaly_detection()`: 이상치 탐지를 위한 K-Means 클러스터링.
    
    ### **d. `logistic_regression.py`**
    - **설명:**
      - 로지스틱 회귀(Logistic Regression) 관련 함수들을 포함하는 모듈입니다.
      - **주요 함수:**
        - `logistic_regression_binary()`: 이진 분류를 위한 로지스틱 회귀 모델 학습 및 평가.
        - `logistic_regression_attrition()`: 직원 이직 예측을 위한 로지스틱 회귀 모델 학습 및 평가.
    
    ### **e. `neural_network.py`**
    - **설명:**
      - 신경망(Neural Network) 회귀 관련 함수들을 포함하는 모듈입니다.
      - **주요 함수:**
        - `neural_network_regression()`: 신경망 회귀 모델 학습 및 평가.
    
    ### **f. `graph_neural_network.py`**
    - **설명:**
      - 그래프 신경망(Graph Neural Network) 분석 관련 함수들을 포함하는 모듈입니다.
      - **주요 함수:**
        - `graph_neural_network_analysis()`: 그래프 신경망을 사용한 데이터 분석 및 예측.

## **7. `README.md`**

- **설명:**
  - 프로젝트의 개요, 설치 방법, 사용법, 기여 방법 등을 설명하는 문서입니다.


## **8. `requirements.txt`**

- **설명:**
  - 프로젝트에서 사용되는 파이썬 패키지들의 목록과 해당 버전을 명시한 파일입니다.
  - **주요 패키지 예시:**
    ```
    pandas==1.5.3
    numpy==1.24.2
    scikit-learn==1.2.2
    tensorflow==2.12.0
    torch==2.0.1
    networkx==3.1
    ```

## **9. `result/` 디렉토리**

- **설명:**
  - 모델 실행 결과가 저장되는 디렉토리입니다.

## **10. `run_tests.py`**

- **설명:**
  - 프로젝트 내 모든 모델과 기능을 테스트하는 스크립트입니다.
  - **주요 기능:**
    - 다양한 테스트 케이스를 실행하여 모델의 정확성, 성능, 안정성을 검증.
    - 테스트 결과를 로그 파일과 `result/` 디렉토리에 저장.
  - **사용 예시:**
    ```bash
    python run_tests.py --config test_config.yaml
    ```

## **11. `test_config.yaml`**

- **설명:**
  - `run_tests.py` 스크립트가 사용할 테스트 설정을 정의한 YAML 파일입니다.
  - **주요 내용:**
    - 테스트할 모델의 목록.
    - 각 모델에 대한 파라미터 설정.
    - 데이터셋 경로.
    - 출력 파일 경로 등.
  - **예시:**
    ```yaml
    tests:
      - model: kmeans_clustering_segmentation
        file_path: ./dataset/Human_Resources_Data_Set.csv
        feature_columns: [Salary, TenureDays, Department]
        num_clusters: 3
      - model: logistic_regression_binary
        file_path: ./dataset/Human_Resources_Data_Set.csv
        target_variable: Termd
        feature_columns: [Salary, TenureDays, Absences]
    ```

## **12. `utils.py`**

- **설명:**
  - 프로젝트 전반에 걸쳐 공통으로 사용되는 유틸리티 함수들을 포함하는 모듈입니다.
  - **주요 기능:**
    - 데이터 로딩: CSV 파일을 읽어 데이터프레임으로 변환.
    - 데이터 전처리: 결측치 처리, 범주형 변수 인코딩, 피처 스케일링 등.
    - 피처 생성: 모델 학습에 필요한 추가 피처 생성.
    - 로깅 설정: 일관된 로깅 포맷과 레벨 설정.
  - **주요 함수:**
    - `load_data(file_path)`: 주어진 경로에서 데이터를 로드.
    - `preprocess_data(df, feature_columns, target_variable)`: 데이터 전처리 수행.
    - `save_results(data, file_path)`: 결과 데이터를 파일로 저장.
    - `setup_logging(log_file)`: 로깅 설정.
---