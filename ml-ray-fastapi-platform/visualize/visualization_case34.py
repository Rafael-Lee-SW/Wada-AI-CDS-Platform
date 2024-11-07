# visualization_case34.py

import json
import base64
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from dash import Dash, dcc, html, Input, Output, State, dash_table
from dash.exceptions import PreventUpdate

# Initialize the Dash app
app = Dash(__name__)
app.title = "Logistic Regression Results Dashboard"

# Define the layout of the app
app.layout = html.Div(
    [
        html.H1("Logistic Regression Results Dashboard", style={"textAlign": "center"}),
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
                html.H2("Decision Boundary Plot"),
                dcc.Graph(id="decision-boundary-plot"),
                html.H2("Classification Report"),
                html.Div(id="classification-report"),
                html.H2("Confusion Matrix"),
                dcc.Graph(id="confusion-matrix-plot"),
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
    Output("error-message", "children"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_output(contents, filename):
    if contents is None:
        return None, {"display": "none"}, "No file uploaded."

    data = parse_contents(contents, filename)

    if data is None:
        return None, {"display": "none"}, "Error parsing the uploaded file."

    status = data.get("status", "success")  # Assuming status is 'success' if not provided
    if status != "success":
        return (
            None,
            {"display": "none"},
            f"The status of the uploaded JSON is not 'success'. Status: {status}",
        )

    result = data.get("result", {})
    if not isinstance(result, dict):
        return (
            None,
            {"display": "none"},
            "'result' field is not a dictionary.",
        )

    model = result.get("model", "").lower()
    if "logisticregression" not in model:
        return (
            None,
            {"display": "none"},
            "This application only supports Logistic Regression results.",
        )

    return None, {"display": "block"}, ""


@app.callback(
    Output("decision-boundary-plot", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_decision_boundary_plot(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "success") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    graph1 = result.get("graph1", {})
    if not graph1:
        raise PreventUpdate

    X_pca = np.array(graph1.get("X_pca", []))
    y = np.array(graph1.get("y", []))
    coefficients = np.array(graph1.get("coefficients", []))
    intercept = np.array(graph1.get("intercept", []))
    classes = graph1.get("classes", [])

    if X_pca.size == 0 or y.size == 0 or coefficients.size == 0 or intercept.size == 0:
        raise PreventUpdate

    # Create the plot
    fig = go.Figure()

    # Add scatter plot for data points
    fig.add_trace(
        go.Scatter(
            x=X_pca[:, 0],
            y=X_pca[:, 1],
            mode="markers",
            marker=dict(
                color=y,
                colorscale="RdBu" if "binary" in result.get("model", "").lower() else "Viridis",
                showscale=False,
                line=dict(width=1, color="black"),
            ),
            name="Data Points",
        )
    )

    # Compute and plot the decision boundary line(s)
    x_min, x_max = X_pca[:, 0].min() - 1, X_pca[:, 0].max() + 1
    x1_vals = np.linspace(x_min, x_max, 200)

    if "binary" in result.get("model", "").lower():
        # For binary classification
        w = coefficients[0]  # Shape (2,)
        b = intercept[0]
        if w[1] != 0:
            # Compute x2 values
            x2_vals = (-b - w[0] * x1_vals) / w[1]
            # Plot the decision boundary line
            fig.add_trace(
                go.Scatter(
                    x=x1_vals,
                    y=x2_vals,
                    mode="lines",
                    line=dict(color="black", width=2),
                    name="Decision Boundary",
                )
            )
    else:
        # For multinomial classification
        n_classes = len(classes)
        x1_vals = np.linspace(x_min, x_max, 200)
        # For each pair of classes
        for i in range(n_classes):
            for j in range(i + 1, n_classes):
                # Compute the coefficients for the decision boundary between class i and class j
                w_i = coefficients[i]
                b_i = intercept[i]
                w_j = coefficients[j]
                b_j = intercept[j]
                w_diff = w_i - w_j  # Shape (2,)
                b_diff = b_i - b_j
                if w_diff[1] != 0:
                    # Compute x2 values
                    x2_vals = (-b_diff - w_diff[0] * x1_vals) / w_diff[1]
                    # Plot the decision boundary line
                    fig.add_trace(
                        go.Scatter(
                            x=x1_vals,
                            y=x2_vals,
                            mode="lines",
                            line=dict(color="black", width=2, dash="dash"),
                            name=f"Boundary between {classes[i]} and {classes[j]}",
                        )
                    )

    fig.update_layout(
        title="Decision Boundary",
        xaxis_title="Principal Component 1",
        yaxis_title="Principal Component 2",
        legend_title="Classes",
    )

    return fig


@app.callback(
    Output("classification-report", "children"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_classification_report(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "success") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    graph3 = result.get("graph3", {})
    report = graph3.get("classification_report", {})

    if not report:
        raise PreventUpdate

    # Convert report to DataFrame for better display
    report_df = pd.DataFrame(report).transpose()
    report_df.reset_index(inplace=True)
    report_df.rename(columns={"index": "Class"}, inplace=True)
    report_df = report_df.round(2)

    return html.Div([
        dash_table.DataTable(
            data=report_df.to_dict("records"),
            columns=[{"name": i, "id": i} for i in report_df.columns],
            style_table={"overflowX": "auto"},
            style_cell={
                "minWidth": "100px",
                "width": "150px",
                "maxWidth": "180px",
                "textAlign": "left",
            },
            style_header={
                "backgroundColor": "paleturquoise",
                "fontWeight": "bold",
            },
        )
    ])


@app.callback(
    Output("confusion-matrix-plot", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_confusion_matrix_plot(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "success") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    graph4 = result.get("graph4", {})
    confusion_matrix = graph4.get("confusion_matrix", [])
    labels = graph4.get("labels", [])

    if not confusion_matrix or not labels:
        raise PreventUpdate

    fig = go.Figure(
        data=go.Heatmap(
            z=confusion_matrix,
            x=labels,
            y=labels,
            colorscale="Blues",
            showscale=True,
            hoverongaps=False,
        )
    )
    fig.update_layout(
        title="Confusion Matrix",
        xaxis_title="Predicted Label",
        yaxis_title="True Label",
    )
    return fig


# Run the Dash app
if __name__ == "__main__":
    app.run_server(debug=True)
