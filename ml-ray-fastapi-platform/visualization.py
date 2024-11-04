# visualization.py

import json
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import os
import sys

def plot_feature_importances(feature_names, importances, title="Feature Importances"):
    """
    Plots the feature importances as a horizontal bar chart.
    
    Parameters:
    - feature_names (list): List of feature names.
    - importances (list): Corresponding feature importances.
    - title (str): Title of the plot.
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
        labels={'Importance': 'Importance', 'Feature': 'Feature'},
        height=600,
    )
    fig.update_layout(yaxis=dict(autorange="reversed"))
    fig.show()

def plot_regression_results(y_test, y_pred, identifiers, title="Actual vs Predicted Values"):
    """
    Plots the Actual vs Predicted values for regression models.
    
    Parameters:
    - y_test (list): Actual target values.
    - y_pred (list): Predicted target values.
    - identifiers (list): Identifiers (e.g., EmpID) for each data point.
    - title (str): Title of the plot.
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
        labels={'Actual': 'Actual Values', 'Predicted': 'Predicted Values'},
    )
    fig.add_trace(
        go.Scatter(
            x=df_results['Actual'],
            y=df_results['Actual'],
            mode='lines',
            name='Perfect Prediction',
            line=dict(color='red', dash='dash')
        )
    )
    fig.update_layout(width=800, height=600)
    fig.show()

def plot_confusion_matrix(confusion, labels, title="Confusion Matrix"):
    """
    Plots the confusion matrix as a heatmap.
    
    Parameters:
    - confusion (list of lists): Confusion matrix values.
    - labels (list): List of label names.
    - title (str): Title of the plot.
    """
    fig = px.imshow(
        confusion,
        text_auto=True,
        x=labels,
        y=labels,
        color_continuous_scale='Blues',
        title=title,
        labels={'x': 'Predicted', 'y': 'Actual'},
    )
    fig.update_layout(width=600, height=600)
    fig.show()

def plot_classification_results(y_test, y_pred, identifiers, title="Classification Results"):
    """
    Plots the classification results with identifiers.
    
    Parameters:
    - y_test (list): Actual class labels.
    - y_pred (list): Predicted class labels.
    - identifiers (list): Identifiers (e.g., EmpID) for each data point.
    - title (str): Title of the plot.
    """
    df_results = pd.DataFrame({
        'Actual': y_test,
        'Predicted': y_pred,
        'Identifier': identifiers
    })
    
    fig = px.scatter(
        df_results,
        x='Identifier',
        y='Predicted',
        color='Actual',
        hover_data=['Identifier'],
        title=title,
        labels={'Identifier': 'Identifier', 'Predicted': 'Predicted Class'},
    )
    fig.update_layout(width=800, height=600)
    fig.show()

def load_json(file_path):
    """
    Loads JSON data from a file.
    
    Parameters:
    - file_path (str): Path to the JSON file.
    
    Returns:
    - data (dict): Parsed JSON data.
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
    Visualizes the results from the JSON file.
    
    Parameters:
    - json_path (str): Path to the JSON file containing model results.
    """
    data = load_json(json_path)
    
    if data.get("status") != "success":
        print(f"Error: Status is not 'success'. Status: {data.get('status')}")
        sys.exit(1)
    
    result = data.get("result", {})
    model_info = result.get("model", {})
    model_type = model_info.get("model_type", "").lower()
    
    # Feature Importances
    feature_names = result.get("feature_names", [])
    feature_importances = result.get("feature_importances", [])
    if feature_names and feature_importances:
        plot_feature_importances(feature_names, feature_importances)
    else:
        print("Warning: Feature names or importances are missing.")
    
    # Determine if it's a regression or classification model
    if "regressor" in model_type:
        # Regression Model Visualizations
        y_test = result.get("y_test", [])
        y_pred = result.get("y_pred", [])
        identifiers_key = next((key for key in result.keys() if key.startswith("identifier_")), None)
        if identifiers_key:
            identifiers = result.get(identifiers_key, [])
            plot_regression_results(y_test, y_pred, identifiers)
        else:
            print("Warning: Identifiers are missing for regression results.")
    elif "classifier" in model_type:
        # Classification Model Visualizations
        y_test = result.get("y_test", [])
        y_pred = result.get("y_pred", [])
        confusion = result.get("confusion_matrix", [])
        report = result.get("report", {})
        
        # Extract class labels from the classification report
        class_labels = list(report.keys())
        # Remove 'accuracy', 'macro avg', 'weighted avg' if present
        class_labels = [label for label in class_labels if label not in ['accuracy', 'macro avg', 'weighted avg']]
        
        if confusion and class_labels:
            plot_confusion_matrix(confusion, class_labels)
        else:
            print("Warning: Confusion matrix or class labels are missing.")
        
        identifiers_key = next((key for key in result.keys() if key.startswith("identifier_")), None)
        if identifiers_key:
            identifiers = result.get(identifiers_key, [])
            plot_classification_results(y_test, y_pred, identifiers)
        else:
            print("Warning: Identifiers are missing for classification results.")
    else:
        print(f"Warning: Unrecognized model type '{model_type}'. No additional visualizations will be generated.")

if __name__ == "__main__":
    """
    Usage:
        python visualization.py path/to/test_1.json
    """
    if len(sys.argv) != 2:
        print("Usage: python visualization.py path/to/test_result.json")
        sys.exit(1)
    
    json_file_path = sys.argv[1]
    visualize_results(json_file_path)
