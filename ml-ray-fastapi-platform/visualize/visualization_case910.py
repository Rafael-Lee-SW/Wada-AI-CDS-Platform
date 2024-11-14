# visualization_case910.py

import json
import base64
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, dcc, html, Input, Output, State, dash_table
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc

# Initialize the Dash app
app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "Support Vector Machine Results Dashboard"

# Define the layout of the app
app.layout = html.Div(
    [
        html.H1(
            "Support Vector Machine Results Dashboard", style={"textAlign": "center"}
        ),
        html.Div(
            [
                dcc.Upload(
                    id="upload-json",
                    children=html.Div(
                        ["Drag and Drop or ", html.A("Select JSON File")]
                    ),
                    style={
                        "width": "50%",
                        "height": "60px",
                        "lineHeight": "60px",
                        "borderWidth": "2px",
                        "borderStyle": "dashed",
                        "borderRadius": "5px",
                        "textAlign": "center",
                        "margin": "10px auto",
                    },
                    multiple=False,
                ),
            ]
        ),
        html.Div(id="output-data-upload"),
        html.Div(
            id="plots-container",
            style={"display": "none"},
            children=[
                html.Div(
                    id="classification-container",
                    style={"display": "none"},
                    children=[
                        html.H2("Classification Results"),
                        html.H3("ROC Curve"),
                        dcc.Graph(id="roc-curve"),
                        html.H3("Precision-Recall Curve"),
                        dcc.Graph(id="pr-curve"),
                        html.H3("Confusion Matrix"),
                        dcc.Graph(id="confusion-matrix"),
                        html.H3("Classification Report"),
                        dash_table.DataTable(
                            id="classification-report",
                            style_table={"overflowX": "auto"},
                            style_cell={
                                "minWidth": "100px",
                                "width": "150px",
                                "maxWidth": "180px",
                                "overflow": "hidden",
                                "textOverflow": "ellipsis",
                                "textAlign": "left",
                            },
                            style_header={
                                "backgroundColor": "paleturquoise",
                                "fontWeight": "bold",
                            },
                        ),
                        html.H3("Decision Boundary"),
                        dcc.Graph(id="decision-boundary"),
                    ],
                ),
                html.Div(
                    id="regression-container",
                    style={"display": "none"},
                    children=[
                        html.H2("Regression Results"),
                        html.H3("Actual vs Predicted"),
                        dcc.Graph(id="regression-plot"),
                        html.H3("Regression Line"),
                        dcc.Graph(id="regression-surface"),
                        html.H3("Model Performance Metrics"),
                        html.Div(id="regression-metrics"),
                    ],
                ),
            ],
        ),
        html.Div(
            id="error-message",
            style={"color": "red", "textAlign": "center", "marginTop": "20px"},
        ),
    ]
)


def parse_contents(contents, filename):
    """
    Parses the uploaded JSON file content.
    """
    if contents is None:
        return None  # Return None if contents is None

    content_type, content_string = contents.split(",")
    decoded = base64.b64decode(content_string)
    try:
        if "json" in filename:
            data = json.loads(decoded)
            return data
        else:
            return None
    except Exception as e:
        print(e)
        return None


@app.callback(
    Output("output-data-upload", "children"),
    Output("plots-container", "style"),
    Output("classification-container", "style"),
    Output("regression-container", "style"),
    Output("error-message", "children"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_output(contents, filename):
    if contents is None:
        return (
            None,
            {"display": "none"},
            {"display": "none"},
            {"display": "none"},
            "No file uploaded.",
        )

    data = parse_contents(contents, filename)

    if data is None:
        return (
            None,
            {"display": "none"},
            {"display": "none"},
            {"display": "none"},
            "Error parsing the uploaded file.",
        )

    status = data.get("status", "")
    if status != "success":
        return (
            None,
            {"display": "none"},
            {"display": "none"},
            {"display": "none"},
            f"The status of the uploaded JSON is not 'success'. Status: {status}",
        )

    result = data.get("result", {})
    if not isinstance(result, dict):
        return (
            None,
            {"display": "none"},
            {"display": "none"},
            {"display": "none"},
            "'result' field is not a dictionary.",
        )

    model = result.get("model", "").lower()
    if "classifier" in model:
        classification_style = {"display": "block"}
        regression_style = {"display": "none"}
    elif "regressor" in model:
        classification_style = {"display": "none"}
        regression_style = {"display": "block"}
    else:
        return (
            None,
            {"display": "none"},
            {"display": "none"},
            {"display": "none"},
            "Unsupported model type.",
        )

    return None, {"display": "block"}, classification_style, regression_style, ""


# Callbacks for Classification
@app.callback(
    Output("roc-curve", "figure"),
    Output("pr-curve", "figure"),
    Output("confusion-matrix", "figure"),
    Output("classification-report", "data"),
    Output("classification-report", "columns"),
    Output("decision-boundary", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_classification_plots(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)

    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    model = result.get("model", "").lower()
    if "classifier" not in model:
        raise PreventUpdate

    # ROC Curve
    graph1 = result.get("graph1", {})
    fpr = graph1.get("fpr", [])
    tpr = graph1.get("tpr", [])
    roc_auc = result.get("roc_auc_score", None)
    if fpr and tpr and roc_auc is not None:
        roc_fig = go.Figure()
        roc_fig.add_trace(go.Scatter(x=fpr, y=tpr, mode="lines", name="ROC Curve"))
        roc_fig.add_trace(
            go.Scatter(
                x=[0, 1],
                y=[0, 1],
                mode="lines",
                name="Random Classifier",
                line=dict(dash="dash"),
            )
        )
        roc_fig.update_layout(
            title=f"ROC Curve (AUC = {roc_auc:.2f})",
            xaxis_title="False Positive Rate",
            yaxis_title="True Positive Rate",
        )
    else:
        roc_fig = go.Figure()

    # Precision-Recall Curve
    precision = graph1.get("precision", [])
    recall = graph1.get("recall", [])
    pr_auc = result.get("pr_auc", None)
    if precision and recall and pr_auc is not None:
        pr_fig = go.Figure()
        pr_fig.add_trace(
            go.Scatter(
                x=recall, y=precision, mode="lines", name="Precision-Recall Curve"
            )
        )
        pr_fig.update_layout(
            title=f"Precision-Recall Curve (AUC = {pr_auc:.2f})",
            xaxis_title="Recall",
            yaxis_title="Precision",
        )
    else:
        pr_fig = go.Figure()

    # Confusion Matrix
    graph4 = result.get("graph4", {})
    confusion_matrix = graph4.get("confusion_matrix", [])
    labels = graph4.get("labels", [])
    if confusion_matrix and labels:
        cm_fig = go.Figure(
            data=go.Heatmap(
                z=confusion_matrix,
                x=labels,
                y=labels,
                colorscale="Blues",
                showscale=True,
                text=[[str(value) for value in row] for row in confusion_matrix],
                texttemplate="%{text}",
            )
        )
        cm_fig.update_layout(
            title="Confusion Matrix",
            xaxis_title="Predicted Label",
            yaxis_title="True Label",
        )
    else:
        cm_fig = go.Figure()

    # Classification Report
    graph3 = result.get("graph3", {})
    classification_report = graph3.get("classification_report", {})
    if classification_report:
        report_df = pd.DataFrame(classification_report).transpose().reset_index()
        columns = [{"name": i, "id": i} for i in report_df.columns]
        data_table = report_df.to_dict("records")
    else:
        columns = []
        data_table = []

    # Decision Boundary
    graph2 = result.get("graph2", {})
    X_vis = graph2.get("X_vis", [])
    y_vis = graph2.get("y_vis", [])
    xx = graph2.get("xx", [])
    yy = graph2.get("yy", [])
    Z = graph2.get("Z", [])

    if X_vis and y_vis and xx and yy and Z:
        X_vis = np.array(X_vis)
        y_vis = np.array(y_vis)
        xx = np.array(xx)
        yy = np.array(yy)
        Z = np.array(Z)

        if X_vis.shape[1] == 2:
            boundary_fig = go.Figure()

            # Add contour for decision boundary
            boundary_fig.add_trace(
                go.Contour(
                    x=xx[0],
                    y=yy[:, 0],
                    z=Z,
                    showscale=False,
                    colorscale="RdBu",
                    opacity=0.5,
                    contours=dict(start=-1, end=1, size=0.5, coloring="lines"),
                )
            )

            # Add scatter plot for data points
            boundary_fig.add_trace(
                go.Scatter(
                    x=X_vis[:, 0],
                    y=X_vis[:, 1],
                    mode="markers",
                    showlegend=True,
                    marker=dict(
                        color=y_vis,
                        colorscale="Viridis",
                        symbol="circle",
                        size=7,
                        line=dict(width=1, color="black"),
                    ),
                    name="Data Points",
                )
            )

            boundary_fig.update_layout(
                title="Decision Boundary",
                xaxis_title="Feature 1",
                yaxis_title="Feature 2",
            )
        else:
            boundary_fig = go.Figure()
    else:
        boundary_fig = go.Figure()

    return roc_fig, pr_fig, cm_fig, data_table, columns, boundary_fig


# Callbacks for Regression
@app.callback(
    Output("regression-plot", "figure"),
    Output("regression-surface", "figure"),
    Output("regression-metrics", "children"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_regression_plots(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)

    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    model = result.get("model", "").lower()
    if "regressor" not in model:
        raise PreventUpdate

    # Regression Plot
    graph1 = result.get("graph1", {})
    X_vis = np.array(graph1.get("X_vis", []))
    y_vis = np.array(graph1.get("y_vis", []))
    y_pred = np.array(graph1.get("y_pred", []))
    regression_surface = graph1.get("regression_surface", {})

    if X_vis.size > 0 and y_vis.size > 0:
        if X_vis.ndim == 1 or (X_vis.ndim == 2 and X_vis.shape[1] == 1):
            # Ensure X_vis is 2D array with one column
            X_vis = X_vis.reshape(-1, 1)
            # 1D plot
            reg_fig = go.Figure()
            reg_fig.add_trace(
                go.Scatter(x=X_vis[:, 0], y=y_vis, mode="markers", name="Actual")
            )
            reg_fig.add_trace(
                go.Scatter(x=X_vis[:, 0], y=y_pred, mode="markers", name="Predicted")
            )
            reg_fig.update_layout(
                title="Actual vs Predicted",
                xaxis_title="Feature 1",
                yaxis_title="Target",
            )
            # Regression Line
            surface_fig = go.Figure()
            X_grid = np.array(regression_surface.get("X_grid", []))
            y_grid_pred = np.array(regression_surface.get("y_grid_pred", []))
            if X_grid.size > 0 and y_grid_pred.size > 0:
                surface_fig.add_trace(
                    go.Scatter(
                        x=X_grid, y=y_grid_pred, mode="lines", name="Regression Line"
                    )
                )
                surface_fig.update_layout(
                    title="Regression Line",
                    xaxis_title="Feature 1",
                    yaxis_title="Predicted Target",
                )
            else:
                surface_fig = go.Figure()
        elif X_vis.shape[1] == 2:
            # 2D plot (not applicable here but included for completeness)
            reg_fig = go.Figure()
            reg_fig.add_trace(
                go.Scatter3d(
                    x=X_vis[:, 0],
                    y=X_vis[:, 1],
                    z=y_vis,
                    mode="markers",
                    marker=dict(size=3),
                    name="Actual",
                )
            )
            reg_fig.add_trace(
                go.Scatter3d(
                    x=X_vis[:, 0],
                    y=X_vis[:, 1],
                    z=y_pred,
                    mode="markers",
                    marker=dict(size=3),
                    name="Predicted",
                )
            )
            reg_fig.update_layout(
                title="Actual vs Predicted",
                scene=dict(
                    xaxis_title="Feature 1",
                    yaxis_title="Feature 2",
                    zaxis_title="Target",
                ),
            )

            # Regression Surface
            xx = np.array(regression_surface.get("xx", []))
            yy = np.array(regression_surface.get("yy", []))
            Z = np.array(regression_surface.get("Z", []))
            if xx.size > 0 and yy.size > 0 and Z.size > 0:
                surface_fig = go.Figure()
                surface_fig.add_trace(
                    go.Surface(
                        x=xx,
                        y=yy,
                        z=Z,
                        colorscale="Viridis",
                        opacity=0.7,
                        name="Regression Surface",
                    )
                )
                surface_fig.add_trace(
                    go.Scatter3d(
                        x=X_vis[:, 0],
                        y=X_vis[:, 1],
                        z=y_vis,
                        mode="markers",
                        marker=dict(size=3),
                        name="Data Points",
                    )
                )
                surface_fig.update_layout(
                    title="Regression Surface",
                    scene=dict(
                        xaxis_title="Feature 1",
                        yaxis_title="Feature 2",
                        zaxis_title="Target",
                    ),
                )
            else:
                surface_fig = go.Figure()
        else:
            reg_fig = go.Figure()
            surface_fig = go.Figure()
    else:
        reg_fig = go.Figure()
        surface_fig = go.Figure()

    # Model Performance Metrics
    mse = result.get("mse", None)
    r2_score_value = result.get("r2_score", None)
    metrics_div = html.Div(
        [
            html.P(
                f"Mean Squared Error (MSE): {mse:.2f}"
                if mse is not None
                else "MSE: N/A"
            ),
            html.P(
                f"R-squared (R2 Score): {r2_score_value:.2f}"
                if r2_score_value is not None
                else "R2 Score: N/A"
            ),
        ]
    )

    return reg_fig, surface_fig, metrics_div


# Run the Dash app
if __name__ == "__main__":
    app.run_server(debug=True)
