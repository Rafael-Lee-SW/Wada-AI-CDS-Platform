# visualization_case1.py

import json
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import os
import sys

def plot_feature_importances(feature_names, importances, title="Feature Importances"):
    """
    특성 중요도를 수평 막대 그래프로 시각화합니다.
    
    Parameters:
    - feature_names (list): 특성 이름 리스트.
    - importances (list): 각 특성의 중요도 리스트.
    - title (str): 그래프 제목.
    """
    df_importances = pd.DataFrame({
        'Feature': feature_names,
        'Importance': importances
    }).sort_values(by='Importance', ascending=False)
    
    fig = px.bar(
        df_importances,
        x='Importance',
        y='Feature',
        orientation='h',
        title=title,
        labels={'Importance': '중요도', 'Feature': '특성'},
        height=600,
    )
    fig.update_layout(yaxis=dict(autorange="reversed"))
    fig.show()

def plot_regression_results(y_test, y_pred, identifiers, title="Actual vs Predicted Values"):
    """
    회귀 모델의 실제 값과 예측 값을 산점도로 시각화합니다.
    
    Parameters:
    - y_test (list): 실제 타겟 값 리스트.
    - y_pred (list): 예측 타겟 값 리스트.
    - identifiers (list): 각 데이터 포인트의 식별자 리스트.
    - title (str): 그래프 제목.
    """
    df_results = pd.DataFrame({
        'Actual': y_test,
        'Predicted': y_pred,
        'Identifier': identifiers
    })
    
    fig = px.scatter(
        df_results,
        x='Actual',
        y='Predicted',
        hover_data=['Identifier'],
        title=title,
        labels={'Actual': '실제 값', 'Predicted': '예측 값'},
    )
    fig.add_trace(
        go.Scatter(
            x=df_results['Actual'],
            y=df_results['Actual'],
            mode='lines',
            name='완벽한 예측',
            line=dict(color='red', dash='dash')
        )
    )
    fig.update_layout(width=800, height=600)
    fig.show()

def plot_confusion_matrix(confusion, labels, title="Confusion Matrix"):
    """
    혼동 행렬을 히트맵으로 시각화합니다.
    
    Parameters:
    - confusion (list of lists): 혼동 행렬 값 리스트.
    - labels (list): 클래스 라벨 리스트.
    - title (str): 그래프 제목.
    """
    fig = px.imshow(
        confusion,
        text_auto=True,
        x=labels,
        y=labels,
        color_continuous_scale='Blues',
        title=title,
        labels={'x': '예측', 'y': '실제'},
    )
    fig.update_layout(width=600, height=600)
    fig.show()

def plot_classification_results(y_test, y_pred, identifiers, title="Classification Results"):
    """
    분류 모델의 실제 값과 예측 값을 산점도로 시각화합니다.
    
    Parameters:
    - y_test (list): 실제 클래스 라벨 리스트.
    - y_pred (list): 예측 클래스 라벨 리스트.
    - identifiers (list): 각 데이터 포인트의 식별자 리스트.
    - title (str): 그래프 제목.
    """
    df_results = pd.DataFrame({
        'Actual': y_test,
        'Predicted': y_pred,
        'Identifier': identifiers
    })
    
    fig = px.scatter(
        df_results,
        x='Actual',
        y='Predicted',
        color='Actual',
        hover_data=['Identifier'],
        title=title,
        labels={'Actual': '실제 클래스', 'Predicted': '예측 클래스'},
    )
    fig.add_trace(
        go.Scatter(
            x=df_results['Actual'],
            y=df_results['Actual'],
            mode='lines',
            name='완벽한 예측',
            line=dict(color='red', dash='dash')
        )
    )
    fig.update_layout(width=800, height=600)
    fig.show()

def plot_classification_metrics(accuracy, report, title="Classification Report"):
    """
    분류 모델의 평가 지표를 표로 시각화합니다.
    
    Parameters:
    - accuracy (float): 정확도.
    - report (dict): 분류 보고서 딕셔너리.
    - title (str): 그래프 제목.
    """
    # 'accuracy', 'macro avg', 'weighted avg' 제외
    metrics = {k: v for k, v in report.items() if k not in ['accuracy', 'macro avg', 'weighted avg']}
    df_metrics = pd.DataFrame(metrics).transpose().reset_index()
    df_metrics.rename(columns={'index': 'Class'}, inplace=True)
    
    fig = go.Figure(data=[go.Table(
        header=dict(values=['Class', 'Precision', 'Recall', 'F1-Score', 'Support'],
                    fill_color='paleturquoise',
                    align='left'),
        cells=dict(values=[
            df_metrics['Class'],
            df_metrics['precision'],
            df_metrics['recall'],
            df_metrics['f1-score'],
            df_metrics['support']
        ],
        fill_color='lavender',
        align='left'))
    ])
    fig.update_layout(title_text=title)
    fig.show()
    
    # 정확도 출력
    print(f"정확도 (Accuracy): {accuracy:.4f}")

def load_json(file_path):
    """
    JSON 파일을 로드합니다.
    
    Parameters:
    - file_path (str): JSON 파일 경로.
    
    Returns:
    - data (dict): 로드된 JSON 데이터.
    """
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist.")
        sys.exit(1)
    
    with open(file_path, 'r') as f:
        try:
            data = json.load(f)
            return data
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            sys.exit(1)

def visualize_results(json_path):
    """
    JSON 파일의 결과를 시각화합니다.
    
    Parameters:
    - json_path (str): 시각화할 JSON 파일 경로.
    """
    data = load_json(json_path)
    
    # 'status' 필드 확인
    status = data.get("status", "")
    if status != "success":
        print(f"Error: Status is not 'success'. Status: {status}")
        sys.exit(1)
    
    # 'result' 필드 확인
    result = data.get("result", {})
    if not isinstance(result, dict):
        print(f"Error: 'result' 필드는 딕셔너리여야 합니다. 현재 타입: {type(result)}")
        sys.exit(1)
    
    # 'model' 필드 확인
    model = result.get("model", "")
    if not isinstance(model, str):
        print(f"Error: 'model' 필드는 문자열이어야 합니다. 현재 타입: {type(model)}")
        sys.exit(1)
    model_type = model.lower()
    
    if "regressor" in model_type:
        # 회귀 모델 시각화
        # graph1: 특성 중요도 막대 그래프
        graph1 = result.get("graph1", {})
        if graph1.get("graph_type") == "bar":
            feature_names = graph1.get("feature_names", [])
            feature_importances = graph1.get("feature_importances", [])
            if feature_names and feature_importances:
                plot_feature_importances(feature_names, feature_importances)
            else:
                print("Warning: Feature names or importances are missing.")
        
        # graph2: 실제 값 vs 예측 값 산점도
        graph2 = result.get("graph2", {})
        if graph2.get("graph_type") == "scatter":
            y_test = graph2.get("y_test", [])
            y_pred = graph2.get("y_pred", [])
            identifiers = graph2.get("identifier", [])
            if y_test and y_pred and identifiers:
                plot_regression_results(y_test, y_pred, identifiers)
            else:
                print("Warning: y_test, y_pred, or identifier data is missing for regression results.")
    
    elif "classifier" in model_type:
        # 분류 모델 시각화
        # graph1: 특성 중요도 막대 그래프
        graph1 = result.get("graph1", {})
        if graph1.get("graph_type") == "bar":
            feature_names = graph1.get("feature_names", [])
            feature_importances = graph1.get("feature_importances", [])
            if feature_names and feature_importances:
                plot_feature_importances(feature_names, feature_importances)
            else:
                print("Warning: Feature names or importances are missing.")
        
        # graph2: 실제 값 vs 예측 값 산점도
        graph2 = result.get("graph2", {})
        if graph2.get("graph_type") == "scatter":
            y_test = graph2.get("y_test", [])
            y_pred = graph2.get("y_pred", [])
            identifiers = graph2.get("identifier", [])
            if y_test and y_pred and identifiers:
                plot_classification_results(y_test, y_pred, identifiers)
            else:
                print("Warning: y_test, y_pred, or identifier data is missing for classification results.")
        
        # 혼동 행렬 히트맵
        confusion = result.get("confusion_matrix", [])
        if confusion:
            # 분류 보고서에서 클래스 라벨 추출
            report = result.get("report", {})
            if isinstance(report, dict):
                class_labels = [label for label in report.keys() if label not in ['accuracy', 'macro avg', 'weighted avg']]
                if class_labels:
                    plot_confusion_matrix(confusion, class_labels)
                else:
                    print("Warning: Class labels are missing in the classification report.")
            else:
                print("Warning: 'report' 필드는 딕셔너리여야 합니다.")
        
        # 분류 평가 지표 시각화
        accuracy = result.get("accuracy", None)
        report = result.get("report", {})
        if accuracy is not None and isinstance(report, dict):
            plot_classification_metrics(accuracy, report)
        else:
            print("Warning: Accuracy or report is missing for classification metrics.")
    else:
        print(f"Warning: Unrecognized model type '{model}'. No additional visualizations will be generated.")

if __name__ == "__main__":
    """
    실행 방법:
        python visualization_case1.py path/to/test_1.json
    """
    if len(sys.argv) != 2:
        print("Usage: python visualization_case1.py path/to/test_result.json")
        sys.exit(1)
    
    json_file_path = sys.argv[1]
    visualize_results(json_file_path)
