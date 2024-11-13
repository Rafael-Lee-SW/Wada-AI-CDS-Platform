# visualize/visualization_case78.py

import json
import base64
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from dash import Dash, dcc, html, Input, Output, State, dash_table
from dash.exceptions import PreventUpdate
import numpy as np

# Initialize the Dash app
app = Dash(__name__)
app.title = "Model Results Dashboard"

# Define the layout of the app
app.layout = html.Div(
    [
        html.H1("Model Results Dashboard", style={"textAlign": "center"}),
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
                    id="kmeans-plots",
                    style={"display": "none"},
                    children=[
                        html.H2("Cluster Distribution"),
                        dcc.Graph(id="cluster-distribution"),
                        html.H2("Cluster Scatter Plot"),
                        dcc.Graph(id="cluster-scatter"),
                        html.H2("Clustered Data Sample"),
                        dash_table.DataTable(
                            id="clustered-data-table",
                            page_size=20,
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
                            filter_action="native",
                            sort_action="native",
                            sort_mode="multi",
                            column_selectable="single",
                            row_selectable="multi",
                            selected_columns=[],
                            selected_rows=[],
                        ),
                        html.Div(
                            id="anomaly-section",
                            children=[
                                html.H2("Anomaly Detection"),
                                html.Div(
                                    [
                                        html.Label(
                                            "Select number of anomalies to highlight per cluster:"
                                        ),
                                        dcc.Slider(
                                            id="num-anomalies-slider",
                                            min=1,
                                            max=10,
                                            step=1,
                                            value=3,
                                            marks={i: str(i) for i in range(1, 11)},
                                            tooltip={"placement": "bottom"},
                                        ),
                                        html.Div(
                                            id="num-anomalies-output",
                                            style={
                                                "textAlign": "center",
                                                "marginTop": "10px",
                                            },
                                        ),
                                    ],
                                    style={"width": "50%", "margin": "0 auto"},
                                ),
                                html.H2("Anomaly Scatter Plot"),
                                dcc.Graph(id="anomaly-scatter"),
                            ],
                            style={"display": "none"},
                        ),  # Initially hidden
                    ],
                ),
                html.Div(
                    id="nn-regressor-plots",
                    style={"display": "none"},
                    children=[
                        html.H2("Model Architecture"),
                        dcc.Graph(id="nn-architecture-diagram"),
                        html.H2("Loss Curve"),
                        dcc.Graph(id="nn-loss-curve"),
                        html.H2("Predictions vs Actual"),
                        dcc.Graph(id="nn-prediction-scatter"),
                        html.H2("Regression Metrics"),
                        dash_table.DataTable(
                            id="nn-metrics-table",
                            style_table={"overflowX": "auto"},
                            style_cell={
                                "minWidth": "150px",
                                "width": "200px",
                                "maxWidth": "250px",
                                "overflow": "hidden",
                                "textOverflow": "ellipsis",
                                "textAlign": "left",
                            },
                            style_header={
                                "backgroundColor": "paleturquoise",
                                "fontWeight": "bold",
                            },
                        ),
                    ],
                ),
                html.Div(
                    id="gnn-plots",
                    style={"display": "none"},
                    children=[
                        html.H2("Model Architecture"),
                        dcc.Graph(id="gnn-architecture-diagram"),
                        html.H2("Loss Curve"),
                        dcc.Graph(id="gnn-loss-curve"),
                        html.H2("Node Embeddings"),
                        dcc.Graph(id="gnn-embeddings-plot"),
                        html.H2("Classification Metrics"),
                        dash_table.DataTable(
                            id="gnn-metrics-table",
                            style_table={"overflowX": "auto"},
                            style_cell={
                                "minWidth": "150px",
                                "width": "200px",
                                "maxWidth": "250px",
                                "overflow": "hidden",
                                "textOverflow": "ellipsis",
                                "textAlign": "left",
                            },
                            style_header={
                                "backgroundColor": "paleturquoise",
                                "fontWeight": "bold",
                            },
                        ),
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


def get_from_result_or_summary(data, key):
    """
    Helper function to get a key from result or summary.
    """
    return data.get("result", {}).get(key) or data.get("summary", {}).get(key)


@app.callback(
    Output("num-anomalies-output", "children"), Input("num-anomalies-slider", "value")
)
def update_num_anomalies_output(value):
    return f"Number of anomalies to highlight per cluster: {value}"


@app.callback(
    Output("output-data-upload", "children"),
    Output("plots-container", "style"),
    Output("kmeans-plots", "style"),
    Output("nn-regressor-plots", "style"),
    Output("gnn-plots", "style"),
    Output("anomaly-section", "style"),
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
            {"display": "none"},
            {"display": "none"},
            f"The status of the uploaded JSON is not 'success'. Status: {status}",
        )

    # Get model from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()

    # Initialize styles
    kmeans_style = {"display": "none"}
    nn_regressor_style = {"display": "none"}
    gnn_style = {"display": "none"}
    anomaly_style = {"display": "none"}
    plots_container_style = {"display": "block"}
    error_message = ""

    if "kmeans" in model:
        kmeans_style = {"display": "block"}
        is_anomaly = "anomalydetection" in model
        anomaly_style = {"display": "block"} if is_anomaly else {"display": "none"}
    elif "neuralnetworkregressor" in model:
        nn_regressor_style = {"display": "block"}
    elif "graphneuralnetwork" in model:
        gnn_style = {"display": "block"}
    else:
        plots_container_style = {"display": "none"}
        error_message = "Unsupported model type."
    return (
        None,
        plots_container_style,
        kmeans_style,
        nn_regressor_style,
        gnn_style,
        anomaly_style,
        error_message,
    )


# Neural Network Regressor Architecture Diagram
@app.callback(
    Output("nn-architecture-diagram", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_nn_architecture_diagram(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model and architecture from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "neuralnetworkregressor" not in model:
        raise PreventUpdate

    architecture_str = get_from_result_or_summary(data, "architecture") or ""
    if not architecture_str:
        raise PreventUpdate

    # Parse the architecture string
    layers = architecture_str.split("->")
    layers = [layer.strip() for layer in layers]

    # Create a simple diagram using Plotly shapes
    fig = go.Figure()
    layer_count = len(layers)
    layer_positions = np.linspace(0, 1, layer_count)

    for idx, (layer_name, pos) in enumerate(zip(layers, layer_positions)):
        fig.add_shape(
            type="rect",
            x0=pos - 0.05,
            y0=0.4,
            x1=pos + 0.05,
            y1=0.6,
            line=dict(color="RoyalBlue"),
            fillcolor="LightSkyBlue",
        )
        fig.add_annotation(
            x=pos,
            y=0.7,
            text=layer_name,
            showarrow=False,
            font=dict(size=12),
            yshift=10,
        )

        # Add arrows between layers
        if idx < layer_count - 1:
            fig.add_annotation(
                x=pos + (layer_positions[1] - layer_positions[0]) / 2,
                y=0.5,
                ax=pos + 0.05,
                ay=0.5,
                xref="x",
                yref="y",
                axref="x",
                ayref="y",
                showarrow=True,
                arrowhead=2,
                arrowsize=1,
                arrowwidth=2,
                arrowcolor="LightSlateGray",
            )

    fig.update_layout(
        title="Neural Network Architecture",
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        height=300,
    )

    return fig


# Neural Network Regressor Callbacks
@app.callback(
    Output("nn-loss-curve", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_nn_loss_curve(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model and graph1 from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "neuralnetworkregressor" not in model:
        raise PreventUpdate

    graph1 = get_from_result_or_summary(data, "graph1") or {}
    loss = graph1.get("loss", [])
    val_loss = graph1.get("val_loss", [])
    epochs = graph1.get("epochs", [])

    if not loss or not val_loss or not epochs:
        raise PreventUpdate

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=epochs, y=loss, mode='lines', name='Training Loss'))
    fig.add_trace(go.Scatter(x=epochs, y=val_loss, mode='lines', name='Validation Loss'))
    fig.update_layout(
        title='Training and Validation Loss',
        xaxis_title='Epochs',
        yaxis_title='Loss',
        legend_title='Loss'
    )
    return fig


@app.callback(
    Output("nn-prediction-scatter", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_nn_prediction_scatter(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model and graph2 from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "neuralnetworkregressor" not in model:
        raise PreventUpdate

    graph2 = get_from_result_or_summary(data, "graph2") or {}
    y_test = graph2.get("y_test", [])
    y_pred = graph2.get("y_pred", [])
    identifiers = graph2.get("identifiers", [])

    if not y_test or not y_pred:
        raise PreventUpdate

    df = pd.DataFrame({
        "Actual": y_test,
        "Predicted": y_pred,
        "Identifier": identifiers
    })

    fig = px.scatter(
        df,
        x="Actual",
        y="Predicted",
        hover_data=["Identifier"],
        title="Predicted vs Actual Values",
        labels={"Actual": "Actual Values", "Predicted": "Predicted Values"}
    )
    fig.add_trace(
        go.Line(x=[df["Actual"].min(), df["Actual"].max()],
                y=[df["Actual"].min(), df["Actual"].max()],
                mode='lines', name='Ideal Fit')
    )
    return fig


@app.callback(
    Output("nn-metrics-table", "data"),
    Output("nn-metrics-table", "columns"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_nn_metrics_table(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model and graph3 from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "neuralnetworkregressor" not in model:
        raise PreventUpdate

    graph3 = get_from_result_or_summary(data, "graph3") or {}
    mse = graph3.get("mse")
    mae = graph3.get("mae")
    r2_score = graph3.get("r2_score")

    if mse is None or mae is None or r2_score is None:
        raise PreventUpdate

    metrics = {
        "Metric": ["Mean Squared Error", "Mean Absolute Error", "R² Score"],
        "Value": [mse, mae, r2_score]
    }

    df_metrics = pd.DataFrame(metrics)
    data_table = df_metrics.to_dict("records")
    columns = [{"name": i, "id": i} for i in df_metrics.columns]

    return data_table, columns


# Graph Neural Network Architecture Diagram
@app.callback(
    Output("gnn-architecture-diagram", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_gnn_architecture_diagram(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model and architecture from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "graphneuralnetwork" not in model:
        raise PreventUpdate

    architecture_str = get_from_result_or_summary(data, "architecture") or ""
    if not architecture_str:
        raise PreventUpdate

    # Parse the architecture string
    layers = architecture_str.split("->")
    layers = [layer.strip() for layer in layers]

    # Create a simple diagram using Plotly shapes
    fig = go.Figure()
    layer_count = len(layers)
    layer_positions = np.linspace(0, 1, layer_count)

    for idx, (layer_name, pos) in enumerate(zip(layers, layer_positions)):
        fig.add_shape(
            type="rect",
            x0=pos - 0.05,
            y0=0.4,
            x1=pos + 0.05,
            y1=0.6,
            line=dict(color="DarkGreen"),
            fillcolor="LightGreen",
        )
        fig.add_annotation(
            x=pos,
            y=0.7,
            text=layer_name,
            showarrow=False,
            font=dict(size=12),
            yshift=10,
        )

        # Add arrows between layers
        if idx < layer_count - 1:
            fig.add_annotation(
                x=pos + (layer_positions[1] - layer_positions[0]) / 2,
                y=0.5,
                ax=pos + 0.05,
                ay=0.5,
                xref="x",
                yref="y",
                axref="x",
                ayref="y",
                showarrow=True,
                arrowhead=2,
                arrowsize=1,
                arrowwidth=2,
                arrowcolor="DarkSlateGray",
            )

    fig.update_layout(
        title="Graph Neural Network Architecture",
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        height=300,
    )

    return fig


# Graph Neural Network Callbacks
@app.callback(
    Output("gnn-loss-curve", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_gnn_loss_curve(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model and graph1 from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "graphneuralnetwork" not in model:
        raise PreventUpdate

    graph1 = get_from_result_or_summary(data, "graph1") or {}
    loss = graph1.get("loss", [])
    val_loss = graph1.get("val_loss", [])
    epochs = graph1.get("epochs", [])

    if not loss or not val_loss or not epochs:
        raise PreventUpdate

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=epochs, y=loss, mode='lines', name='Training Loss'))
    fig.add_trace(go.Scatter(x=epochs, y=val_loss, mode='lines', name='Validation Loss'))
    fig.update_layout(
        title='Training and Validation Loss',
        xaxis_title='Epochs',
        yaxis_title='Loss',
        legend_title='Loss'
    )
    return fig


@app.callback(
    Output("gnn-embeddings-plot", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_gnn_embeddings_plot(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model and graph2 from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "graphneuralnetwork" not in model:
        raise PreventUpdate

    graph2 = get_from_result_or_summary(data, "graph2") or {}
    embeddings = graph2.get("embeddings", [])
    labels = graph2.get("labels", [])

    if not embeddings or not labels:
        raise PreventUpdate

    # Convert embeddings to a DataFrame
    df_embeddings = pd.DataFrame(embeddings)
    if df_embeddings.empty:
        raise PreventUpdate

    # Perform PCA to reduce dimensions to 2 for visualization
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(df_embeddings)
    df_embeddings["PC1"] = X_pca[:, 0]
    df_embeddings["PC2"] = X_pca[:, 1]
    df_embeddings["Label"] = labels

    fig = px.scatter(
        df_embeddings,
        x="PC1",
        y="PC2",
        color="Label",
        title="Node Embeddings Visualization",
        labels={"PC1": "Principal Component 1", "PC2": "Principal Component 2"},
    )
    return fig


@app.callback(
    Output("gnn-metrics-table", "data"),
    Output("gnn-metrics-table", "columns"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_gnn_metrics_table(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    # Get model from result or summary
    model = get_from_result_or_summary(data, "model") or ""
    model = model.lower()
    if "graphneuralnetwork" not in model:
        raise PreventUpdate

    # Get metrics from result or summary
    metrics = get_from_result_or_summary(data, "metrics") or {}
    accuracy = metrics.get("accuracy")
    val_accuracy = metrics.get("val_accuracy")
    loss = metrics.get("loss")
    val_loss = metrics.get("val_loss")

    if any(v is None for v in [accuracy, val_accuracy, loss, val_loss]):
        raise PreventUpdate

    metrics_table = {
        "Metric": ["Accuracy", "Validation Accuracy", "Loss", "Validation Loss"],
        "Value": [accuracy, val_accuracy, loss, val_loss],
    }

    df_metrics = pd.DataFrame(metrics_table)
    data_table = df_metrics.to_dict("records")
    columns = [{"name": i, "id": i} for i in df_metrics.columns]

    return data_table, columns


# Run the Dash app
if __name__ == "__main__":
    app.run_server(debug=True)
