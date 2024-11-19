# visualize/visualization_case1.py

import json
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import os
import sys
import numpy as np


def plot_feature_importances(feature_names, importances, title="Feature Importances"):
    """
    Visualizes feature importances as a horizontal bar chart with enhanced labels and colors.

    Parameters:
    - feature_names (list): List of feature names.
    - importances (list): List of feature importance scores.
    - title (str): Title of the plot.
    """
    df_importances = pd.DataFrame(
        {"Feature": feature_names, "Importance": importances}
    ).sort_values(by="Importance", ascending=False)

    fig = px.bar(
        df_importances,
        x="Importance",
        y="Feature",
        orientation="h",
        title=title,
        labels={"Importance": "Importance", "Feature": "Feature"},
        height=600,
        color="Importance",
        color_continuous_scale="Blues",
    )
    fig.update_layout(yaxis=dict(autorange="reversed"))
    fig.show()


def plot_probabilities(
    y_test,
    y_pred,
    y_proba,
    identifiers,
    title="Prediction Probabilities",
    initial_threshold=0.5,
    threshold_step=0.05,
):
    """
    Enhances probability plots with color coding based on threshold and interactive tooltips.
    Removes the shaded area above the threshold for a cleaner visualization.

    Parameters:
    - y_test (list): Actual class labels.
    - y_pred (list): Predicted class labels.
    - y_proba (list of lists): Prediction probabilities for each class.
    - identifiers (list): Unique identifiers for each data point.
    - title (str): Title of the plot.
    - initial_threshold (float): Initial position of the reference line.
    - threshold_step (float): Step size for the threshold slider.
    """
    df_prob = pd.DataFrame(
        {
            "Identifier": identifiers,
            "Actual": y_test,
            "Predicted": y_pred,
            "Prob_Class_0": [prob[0] for prob in y_proba],
            "Prob_Class_1": [prob[1] for prob in y_proba],
        }
    )

    # Define threshold values for the slider
    thresholds = np.arange(0, 1.05, threshold_step).round(2)

    # Function to assign colors based on threshold
    def assign_colors(df, thresh):
        colors = []
        for _, row in df.iterrows():
            if row["Prob_Class_1"] >= thresh:
                colors.append("red")  # Red for above threshold
            else:
                colors.append("blue")  # Blue for below threshold
        return colors

    # Initial color assignment
    initial_colors = assign_colors(df_prob, initial_threshold)

    # Create initial figure with the initial threshold and colors
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df_prob["Identifier"],
            y=df_prob["Prob_Class_1"],
            mode="markers",
            name="Probability Class 1",
            marker=dict(color=initial_colors, opacity=0.6),
            hovertemplate="<b>Identifier:</b> %{x}<br>"
            "<b>Probability Class 1:</b> %{y:.2f}<br>"
            "<b>Actual:</b> %{customdata[0]}<br>"
            "<b>Predicted:</b> %{customdata[1]}",
            customdata=df_prob[["Actual", "Predicted"]],
        )
    )

    # Add initial reference line
    fig.add_shape(
        type="line",
        x0=df_prob["Identifier"].min(),
        y0=initial_threshold,
        x1=df_prob["Identifier"].max(),
        y1=initial_threshold,
        line=dict(color="red", dash="dash"),
    )

    # Create frames for each threshold value
    frames = []
    for thresh in thresholds:
        frame_colors = assign_colors(df_prob, thresh)
        frame = go.Frame(
            data=[
                go.Scatter(
                    x=df_prob["Identifier"],
                    y=df_prob["Prob_Class_1"],
                    mode="markers",
                    marker=dict(color=frame_colors, opacity=0.6),
                    hovertemplate="<b>Identifier:</b> %{x}<br>"
                    "<b>Probability Class 1:</b> %{y:.2f}<br>"
                    "<b>Actual:</b> %{customdata[0]}<br>"
                    "<b>Predicted:</b> %{customdata[1]}",
                    customdata=df_prob[["Actual", "Predicted"]],
                ),
            ],
            layout=go.Layout(
                shapes=[
                    # Update reference line
                    dict(
                        type="line",
                        x0=df_prob["Identifier"].min(),
                        y0=thresh,
                        x1=df_prob["Identifier"].max(),
                        y1=thresh,
                        line=dict(color="red", dash="dash"),
                    ),
                ]
            ),
            name=str(thresh),
        )
        frames.append(frame)

    # Update layout with slider (without play/pause buttons)
    fig.update_layout(
        title=title,
        xaxis_title="Identifier",
        yaxis_title="Probability Class 1",
        width=1000,
        height=600,
        hovermode="closest",
        sliders=[
            dict(
                active=np.where(thresholds == initial_threshold)[0][0],
                currentvalue={"prefix": "Threshold: "},
                pad={"t": 50},
                steps=[
                    dict(
                        method="animate",
                        args=[
                            [str(thresh)],
                            {
                                "frame": {"duration": 0, "redraw": True},
                                "mode": "immediate",
                                "transition": {"duration": 0},
                            },
                        ],
                        label=str(thresh),
                    )
                    for thresh in thresholds
                ],
            )
        ],
        shapes=[
            dict(
                type="line",
                x0=df_prob["Identifier"].min(),
                y0=initial_threshold,
                x1=df_prob["Identifier"].max(),
                y1=initial_threshold,
                line=dict(color="red", dash="dash"),
            ),
        ],
    )

    fig.frames = frames

    fig.show()


def plot_confusion_matrix(confusion, labels, title="Confusion Matrix"):
    """
    Visualizes the confusion matrix as a heatmap with annotations and improved color scale.

    Parameters:
    - confusion (list of lists): Confusion matrix values.
    - labels (list): List of class labels.
    - title (str): Title of the plot.
    """
    fig = px.imshow(
        confusion,
        text_auto=True,
        x=labels,
        y=labels,
        color_continuous_scale="Viridis",
        title=title,
        labels={"x": "Predicted", "y": "Actual", "color": "Count"},
    )
    fig.update_layout(width=600, height=600)
    fig.show()


def plot_classification_metrics(accuracy, report, title="Classification Report"):
    """
    Visualizes classification metrics in a table with enhanced readability and displays accuracy prominently.

    Parameters:
    - accuracy (float): Accuracy of the model.
    - report (dict): Classification report containing precision, recall, f1-score, and support.
    - title (str): Title of the table.
    """
    # Exclude 'accuracy', 'macro avg', 'weighted avg'
    metrics = {
        k: v
        for k, v in report.items()
        if k not in ["accuracy", "macro avg", "weighted avg"]
    }
    df_metrics = pd.DataFrame(metrics).transpose().reset_index()
    df_metrics.rename(columns={"index": "Class"}, inplace=True)

    fig = go.Figure(
        data=[
            go.Table(
                header=dict(
                    values=["Class", "Precision", "Recall", "F1-Score", "Support"],
                    fill_color="lightblue",
                    align="left",
                ),
                cells=dict(
                    values=[
                        df_metrics["Class"],
                        df_metrics["precision"],
                        df_metrics["recall"],
                        df_metrics["f1-score"],
                        df_metrics["support"],
                    ],
                    fill_color="lightgrey",
                    align="left",
                ),
            )
        ]
    )
    fig.update_layout(title_text=title)
    fig.show()

    # Display accuracy prominently
    accuracy_fig = go.Figure(
        go.Indicator(
            mode="number+gauge",
            value=accuracy * 100,  # Convert to percentage
            title={"text": "Model Accuracy"},
            number={"suffix": "%", "font": {"size": 24}},
            gauge={
                "axis": {"range": [0, 100]},
                "bar": {"color": "darkblue"},
                "steps": [
                    {"range": [0, 50], "color": "lightcoral"},
                    {"range": [50, 75], "color": "lightsalmon"},
                    {"range": [75, 90], "color": "lightgreen"},
                    {"range": [90, 100], "color": "lightseagreen"},
                ],
                "threshold": {
                    "line": {"color": "red", "width": 4},
                    "thickness": 0.75,
                    "value": accuracy * 100,
                },
            },
        )
    )
    accuracy_fig.update_layout(width=400, height=300)
    accuracy_fig.show()


def plot_regression_results(
    y_test, y_pred, identifiers, title="Actual vs Predicted Values"
):
    """
    Visualizes regression model results by plotting actual vs. predicted values with an ideal reference line.

    Parameters:
    - y_test (list): List of actual target values.
    - y_pred (list): List of predicted target values.
    - identifiers (list): List of unique identifiers for each data point.
    - title (str): Title of the plot.
    """
    df_results = pd.DataFrame(
        {"Actual": y_test, "Predicted": y_pred, "Identifier": identifiers}
    )

    fig = px.scatter(
        df_results,
        x="Actual",
        y="Predicted",
        hover_data=["Identifier"],
        title=title,
        labels={"Actual": "Actual Value", "Predicted": "Predicted Value"},
    )
    fig.add_trace(
        go.Scatter(
            x=df_results["Actual"],
            y=df_results["Actual"],
            mode="lines",
            name="Perfect Prediction",
            line=dict(color="red", dash="dash"),
        )
    )
    fig.update_layout(width=800, height=600)
    fig.show()


def plot_classification_results(
    y_test, y_pred, identifiers, title="Classification Results"
):
    """
    Visualizes classification model results by plotting actual vs. predicted classes with an ideal reference line.

    Parameters:
    - y_test (list): List of actual class labels.
    - y_pred (list): List of predicted class labels.
    - identifiers (list): List of unique identifiers for each data point.
    - title (str): Title of the plot.
    """
    df_results = pd.DataFrame(
        {"Actual": y_test, "Predicted": y_pred, "Identifier": identifiers}
    )

    fig = px.scatter(
        df_results,
        x="Actual",
        y="Predicted",
        color="Actual",
        hover_data=["Identifier"],
        title=title,
        labels={"Actual": "Actual Class", "Predicted": "Predicted Class"},
    )
    fig.add_trace(
        go.Scatter(
            x=df_results["Actual"],
            y=df_results["Actual"],
            mode="lines",
            name="Perfect Prediction",
            line=dict(color="red", dash="dash"),
        )
    )
    fig.update_layout(width=800, height=600)
    fig.show()


def load_json(file_path):
    """
    Loads a JSON file.

    Parameters:
    - file_path (str): Path to the JSON file.

    Returns:
    - data (dict): Loaded JSON data.
    """
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist.")
        sys.exit(1)

    with open(file_path, "r") as f:
        try:
            data = json.load(f)
            return data
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            sys.exit(1)


def visualize_results(json_path):
    """
    Visualizes the results from a JSON file.

    Parameters:
    - json_path (str): Path to the JSON file to visualize.
    """
    data = load_json(json_path)

    # Check 'status' field
    status = data.get("status", "")
    if status != "success":
        print(f"Error: Status is not 'success'. Status: {status}")
        sys.exit(1)

    # Check 'result' field
    result = data.get("result", {})
    if not isinstance(result, dict):
        print(
            f"Error: 'result' field must be a dictionary. Current type: {type(result)}"
        )
        sys.exit(1)

    # Check 'model' field
    model = result.get("model", "")
    if not isinstance(model, str):
        print(f"Error: 'model' field must be a string. Current type: {type(model)}")
        sys.exit(1)
    model_type = model.lower()

    if "regressor" in model_type:
        # Visualize regression model
        # graph1: Feature Importances
        graph1 = result.get("graph1", {})
        if graph1.get("graph_type") == "bar":
            feature_names = graph1.get("feature_names", [])
            feature_importances = graph1.get("feature_importances", [])
            if feature_names and feature_importances:
                plot_feature_importances(feature_names, feature_importances)
            else:
                print("Warning: Feature names or importances are missing.")

        # graph2: Actual vs Predicted Scatter Plot
        graph2 = result.get("graph2", {})
        if graph2.get("graph_type") == "scatter":
            y_test = graph2.get("y_test", [])
            y_pred = graph2.get("y_pred", [])
            identifiers = graph2.get("identifier", [])
            if y_test and y_pred and identifiers:
                plot_regression_results(y_test, y_pred, identifiers)
            else:
                print(
                    "Warning: y_test, y_pred, or identifier data is missing for regression results."
                )

    elif "classifier" in model_type:
        # Visualize classification model
        # graph1: Feature Importances
        graph1 = result.get("graph1", {})
        if graph1.get("graph_type") == "bar":
            feature_names = graph1.get("feature_names", [])
            feature_importances = graph1.get("feature_importances", [])
            if feature_names and feature_importances:
                plot_feature_importances(feature_names, feature_importances)
            else:
                print("Warning: Feature names or importances are missing.")

        # graph2: Prediction Probabilities with Slider for Threshold
        graph2 = result.get("graph2", {})
        if graph2.get("graph_type") == "probability":
            y_test = graph2.get("y_test", [])
            y_pred = graph2.get("y_pred", [])
            y_proba = graph2.get("y_proba", [])
            identifiers = graph2.get("identifier", [])
            if y_test and y_pred and y_proba and identifiers:
                plot_probabilities(
                    y_test,
                    y_pred,
                    y_proba,
                    identifiers,
                    title="Prediction Probabilities with Threshold Slider",
                    initial_threshold=0.5,
                    threshold_step=0.05,
                )
            else:
                print(
                    "Warning: y_test, y_pred, y_proba, or identifier data is missing for probability visualization."
                )

        # graph4: Confusion Matrix
        graph4 = result.get("graph4", {})
        if graph4.get("graph_type") == "heatmap":
            confusion = graph4.get("confusion_matrix", [])
            labels = graph4.get("labels", [])

            if confusion and labels:
                plot_confusion_matrix(confusion, labels)
            else:
                print(
                    "Warning: confusion_matrix or labels are missing for confusion matrix plot."
                )

        # graph3: Classification Metrics
        graph3 = result.get("graph3", {})
        if graph3.get("graph_type") == "table":
            classification_report = graph3.get("classification_report", {})
            accuracy = result.get("accuracy", None)
            if classification_report and accuracy is not None:
                plot_classification_metrics(accuracy, classification_report)
            else:
                print(
                    "Warning: classification_report or accuracy is missing for classification metrics."
                )
    else:
        print(
            f"Warning: Unrecognized model type '{model}'. No additional visualizations will be generated."
        )


if __name__ == "__main__":
    """
    How to run:
        python visualization_case1.py path/to/test_1.json
    """
    if len(sys.argv) != 2:
        print("Usage: python visualization_case1.py path/to/test_result.json")
        sys.exit(1)

    json_file_path = sys.argv[1]
    visualize_results(json_file_path)
