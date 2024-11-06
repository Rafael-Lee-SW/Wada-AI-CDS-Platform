# /visualize/visualization_case56.py

import json
import base64
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.colors import hex_to_rgb

from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

import shapely.geometry as geometry
import shapely.affinity

from scipy.spatial import ConvexHull
import numpy as np
from dash import Dash, dcc, html, Input, Output, State, dash_table
from dash.exceptions import PreventUpdate

# Initialize the Dash app
app = Dash(__name__)
app.title = "K-Means Clustering Results Dashboard"

# Define the layout of the app
app.layout = html.Div(
    [
        html.H1("K-Means Clustering Results Dashboard", style={"textAlign": "center"}),
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
                html.H2("Cluster Distribution"),
                dcc.Graph(id="cluster-distribution"),
                html.H2("Cluster Scatter Plot"),
                dcc.Graph(id="cluster-scatter"),
                html.H2("Clustered Data Overview"),
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
                                    style={"textAlign": "center", "marginTop": "10px"},
                                ),
                            ],
                            style={"width": "50%", "margin": "0 auto"},
                        ),
                        html.H2("Anomaly Distribution"),
                        dcc.Graph(id="anomaly-distribution"),
                        html.H2("Anomaly Scatter Plot"),
                        dcc.Graph(id="anomaly-scatter"),
                        html.H2("Anomalies Overview"),
                        dash_table.DataTable(
                            id="anomalies-table",
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
                    ],
                    style={"display": "none"},
                ),  # Initially hidden
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
    Output("num-anomalies-output", "children"), Input("num-anomalies-slider", "value")
)
def update_num_anomalies_output(value):
    return f"Number of anomalies to highlight per cluster: {value}"


@app.callback(
    Output("output-data-upload", "children"),
    Output("plots-container", "style"),
    Output("anomaly-section", "style"),
    Output("error-message", "children"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_output(contents, filename):
    if contents is None:
        return None, {"display": "none"}, {"display": "none"}, "No file uploaded."

    data = parse_contents(contents, filename)

    if data is None:
        return (
            None,
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
            f"The status of the uploaded JSON is not 'success'. Status: {status}",
        )

    result = data.get("result", {})
    if not isinstance(result, dict):
        return (
            None,
            {"display": "none"},
            {"display": "none"},
            "'result' field is not a dictionary.",
        )

    model = result.get("model", "").lower()
    if "kmeans" not in model:
        return (
            None,
            {"display": "none"},
            {"display": "none"},
            "This application only supports K-Means clustering results.",
        )

    is_anomaly = "anomalydetection" in model
    anomaly_style = {"display": "block"} if is_anomaly else {"display": "none"}
    return None, {"display": "block"}, anomaly_style, ""


@app.callback(
    Output("cluster-distribution", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_cluster_distribution(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    distribution = result.get("graph4", {}).get("clustered_data", [])
    df_distribution = pd.DataFrame(distribution)

    # Find the cluster label dynamically
    cluster_label = None
    for col in df_distribution.columns:
        if "Cluster" in col:
            cluster_label = col
            break

    # If no cluster label is found, raise an informative error
    if cluster_label is None:
        return (
            go.Figure(),
            f"Cluster label not found in data columns: {df_distribution.columns.tolist()}",
        )

    distribution_counts = df_distribution[cluster_label].value_counts().reset_index()
    distribution_counts.columns = [cluster_label, "Count"]

    fig = px.bar(
        distribution_counts,
        x=cluster_label,
        y="Count",
        title="Number of Data Points per Cluster",
        labels={cluster_label: "Cluster", "Count": "Number of Data Points"},
    )
    return fig


@app.callback(
    Output("cluster-scatter", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_cluster_scatter(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    df = pd.DataFrame(result.get("graph4", {}).get("clustered_data", []))
    cluster_label = None
    for col in df.columns:
        if "Cluster" in col:
            cluster_label = col
            break

    # Use PCA for 2D representation of features
    feature_columns = result.get("feature_columns_used", [])
    scaler = StandardScaler()
    pca = PCA(n_components=2)
    pca_components = pca.fit_transform(
        scaler.fit_transform(df[feature_columns])
    )
    df["PC1"], df["PC2"] = pca_components[:, 0], pca_components[:, 1]

    fig = px.scatter(
        df,
        x="PC1",
        y="PC2",
        color=cluster_label,
        opacity=0.7,
        title="Cluster Segmentation with Expanded Areas",
        labels={"PC1": "Principal Component 1", "PC2": "Principal Component 2"},
    )

    # Extract the color mapping from the figure
    colors = px.colors.qualitative.Plotly  # Default Plotly colors
    cluster_labels = sorted(df[cluster_label].unique())
    color_map = {
        label: colors[i % len(colors)] for i, label in enumerate(cluster_labels)
    }

    # Enlarge cluster areas
    for cluster in cluster_labels:
        cluster_points = df[df[cluster_label] == cluster][["PC1", "PC2"]].values
        if len(cluster_points) > 2:
            hull = ConvexHull(cluster_points)
            hull_points = cluster_points[hull.vertices]
            # Create a polygon from the convex hull points
            polygon = geometry.Polygon(hull_points)
            centroid = polygon.centroid
            # Expand the polygon by scaling it from the centroid
            expanded_polygon = shapely.affinity.scale(
                polygon, xfact=1.1, yfact=1.1, origin=centroid
            )
            x, y = expanded_polygon.exterior.coords.xy
            x = list(x)
            y = list(y)
            # Get color for the cluster
            hex_color = color_map[cluster]
            rgb_color = hex_to_rgb(hex_color)
            fillcolor = f"rgba({rgb_color[0]}, {rgb_color[1]}, {rgb_color[2]}, 0.2)"  # Semi-transparent fill
            line_color = (
                f"rgba({rgb_color[0]}, {rgb_color[1]}, {rgb_color[2]}, 1)"  # Solid line
            )
            fig.add_trace(
                go.Scatter(
                    x=x,
                    y=y,
                    mode="lines",
                    fill="toself",
                    fillcolor=fillcolor,
                    line=dict(color=line_color),
                    name=f"{cluster} Area",
                    showlegend=False,
                )
            )
    return fig


@app.callback(
    Output("anomaly-distribution", "figure"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_anomaly_distribution(contents, filename):
    # This callback is only relevant if anomalies are present
    data = parse_contents(contents, filename)

    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    model = result.get("model", "").lower()
    if "anomalydetection" not in model:
        raise PreventUpdate

    # We will compute anomalies within the visualization code
    # So we need to get the clustered data
    clustered_data = pd.DataFrame(result.get("graph4", {}).get("clustered_data", []))

    if clustered_data.empty:
        raise PreventUpdate

    # Find the cluster label dynamically
    cluster_label = None
    for col in clustered_data.columns:
        if "Cluster" in col:
            cluster_label = col
            break

    if cluster_label is None:
        raise PreventUpdate

    # Compute anomalies
    anomalies = compute_anomalies(clustered_data, cluster_label)

    if anomalies.empty:
        raise PreventUpdate

    anomaly_counts = anomalies[cluster_label].value_counts().reset_index()
    anomaly_counts.columns = [cluster_label, "Count"]

    fig = px.bar(
        anomaly_counts,
        x=cluster_label,
        y="Count",
        title="Number of Anomalies per Cluster",
        labels={cluster_label: "Cluster", "Count": "Number of Anomalies"},
    )

    return fig


def compute_anomalies(clustered_data, cluster_label, num_anomalies=3):
    """
    Compute anomalies by finding the N farthest points from the centroid in each cluster.
    """
    feature_columns = [col for col in clustered_data.columns if col != cluster_label]
    # Prepare data for PCA
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(clustered_data[feature_columns])
    pca = PCA(n_components=2)
    pca_components = pca.fit_transform(X_scaled)
    clustered_data["PC1"], clustered_data["PC2"] = (
        pca_components[:, 0],
        pca_components[:, 1],
    )

    # Calculate centroids in PCA space
    centroids = (
        clustered_data.groupby(cluster_label)[["PC1", "PC2"]].mean().reset_index()
    )

    # For each cluster, find the N farthest points from the centroid
    anomalies = pd.DataFrame()
    for cluster in clustered_data[cluster_label].unique():
        cluster_points = clustered_data[clustered_data[cluster_label] == cluster]
        centroid = centroids[centroids[cluster_label] == cluster][
            ["PC1", "PC2"]
        ].values[0]
        distances = np.linalg.norm(
            cluster_points[["PC1", "PC2"]].values - centroid, axis=1
        )
        cluster_points = cluster_points.copy()
        cluster_points["Distance"] = distances
        top_anomalies = cluster_points.nlargest(num_anomalies, "Distance")
        anomalies = pd.concat([anomalies, top_anomalies])

    return anomalies


@app.callback(
    Output("anomaly-scatter", "figure"),
    [Input("upload-json", "contents"), Input("num-anomalies-slider", "value")],
    State("upload-json", "filename"),
)
def update_anomaly_scatter(contents, num_anomalies, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    model = result.get("model", "").lower()
    if "anomalydetection" not in model:
        raise PreventUpdate

    clustered_data = pd.DataFrame(result.get("graph4", {}).get("clustered_data", []))

    # Find the cluster label dynamically
    cluster_label = None
    for col in clustered_data.columns:
        if "Cluster" in col:
            cluster_label = col
            break

    if cluster_label is None:
        raise PreventUpdate

    feature_columns = result.get("feature_columns_used", [])

    # Prepare data for PCA
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(clustered_data[feature_columns])
    pca = PCA(n_components=2)
    pca_components = pca.fit_transform(X_scaled)
    clustered_data["PC1"], clustered_data["PC2"] = (
        pca_components[:, 0],
        pca_components[:, 1],
    )

    # Calculate centroids in PCA space
    centroids = (
        clustered_data.groupby(cluster_label)[["PC1", "PC2"]].mean().reset_index()
    )

    # For each cluster, find the N farthest points from the centroid
    anomalies = pd.DataFrame()
    for cluster in clustered_data[cluster_label].unique():
        cluster_points = clustered_data[clustered_data[cluster_label] == cluster]
        centroid = centroids[centroids[cluster_label] == cluster][
            ["PC1", "PC2"]
        ].values[0]
        distances = np.linalg.norm(
            cluster_points[["PC1", "PC2"]].values - centroid, axis=1
        )
        cluster_points = cluster_points.copy()
        cluster_points["Distance"] = distances
        top_anomalies = cluster_points.nlargest(num_anomalies, "Distance")
        anomalies = pd.concat([anomalies, top_anomalies])

    fig = px.scatter(
        clustered_data,
        x="PC1",
        y="PC2",
        color=cluster_label,
        title="Anomaly Detection with Highlighted Anomalies",
        opacity=0.7,
        labels={"PC1": "Principal Component 1", "PC2": "Principal Component 2"},
    )

    # Extract color mapping
    colors = px.colors.qualitative.Plotly
    cluster_labels = sorted(clustered_data[cluster_label].unique())
    color_map = {
        label: colors[i % len(colors)] for i, label in enumerate(cluster_labels)
    }

    # Add anomalies to the plot
    fig.add_trace(
        go.Scatter(
            x=anomalies["PC1"],
            y=anomalies["PC2"],
            mode="markers",
            marker=dict(size=12, color="red", symbol="x"),
            name="Top Anomalies",
            showlegend=True,
        )
    )

    # Draw lines from anomalies to centroids
    for cluster in anomalies[cluster_label].unique():
        cluster_anomalies = anomalies[anomalies[cluster_label] == cluster]
        centroid = centroids[centroids[cluster_label] == cluster][
            ["PC1", "PC2"]
        ].values[0]
        for _, row in cluster_anomalies.iterrows():
            fig.add_trace(
                go.Scatter(
                    x=[row["PC1"], centroid[0]],
                    y=[row["PC2"], centroid[1]],
                    mode="lines",
                    line=dict(color="gray", dash="dash"),
                    showlegend=False,
                )
            )

    # Plot centroids
    fig.add_trace(
        go.Scatter(
            x=centroids["PC1"],
            y=centroids["PC2"],
            mode="markers",
            marker=dict(size=15, color="black", symbol="diamond"),
            name="Centroids",
            showlegend=True,
        )
    )

    # Enlarge cluster areas
    for cluster in cluster_labels:
        cluster_points = clustered_data[clustered_data[cluster_label] == cluster][
            ["PC1", "PC2"]
        ].values
        if len(cluster_points) > 2:
            hull = ConvexHull(cluster_points)
            hull_points = cluster_points[hull.vertices]
            # Create a polygon from the convex hull points
            polygon = geometry.Polygon(hull_points)
            centroid_polygon = polygon.centroid
            # Expand the polygon by scaling it from the centroid
            expanded_polygon = shapely.affinity.scale(
                polygon, xfact=1.1, yfact=1.1, origin=centroid_polygon
            )
            x, y = expanded_polygon.exterior.coords.xy
            x = list(x)
            y = list(y)
            # Get color for the cluster
            hex_color = color_map[cluster]
            rgb_color = hex_to_rgb(hex_color)
            fillcolor = f"rgba({rgb_color[0]}, {rgb_color[1]}, {rgb_color[2]}, 0.2)"
            line_color = f"rgba({rgb_color[0]}, {rgb_color[1]}, {rgb_color[2]}, 1)"
            fig.add_trace(
                go.Scatter(
                    x=x,
                    y=y,
                    mode="lines",
                    fill="toself",
                    fillcolor=fillcolor,
                    line=dict(color=line_color),
                    name=f"{cluster} Area",
                    showlegend=False,
                )
            )
    return fig


@app.callback(
    Output("clustered-data-table", "data"),
    Output("clustered-data-table", "columns"),
    Input("upload-json", "contents"),
    State("upload-json", "filename"),
)
def update_clustered_data_table(contents, filename):
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)

    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    clustered_data = result.get("graph4", {}).get("clustered_data", [])

    if not clustered_data:
        raise PreventUpdate

    df_clustered = pd.DataFrame(clustered_data)

    # Prepare data for Dash DataTable
    data_table = df_clustered.head(100).to_dict("records")  # Display first 100 records
    columns = [{"name": i, "id": i} for i in df_clustered.columns]

    return data_table, columns


@app.callback(
    Output("anomalies-table", "data"),
    Output("anomalies-table", "columns"),
    [Input("upload-json", "contents"), Input("num-anomalies-slider", "value")],
    State("upload-json", "filename"),
)
def update_anomalies_table(contents, num_anomalies, filename):
    # This callback is relevant if anomalies are present
    if contents is None:
        raise PreventUpdate

    data = parse_contents(contents, filename)

    if data is None or data.get("status", "") != "success":
        raise PreventUpdate

    result = data.get("result", {})
    model = result.get("model", "").lower()
    if "anomalydetection" not in model:
        raise PreventUpdate

    clustered_data = pd.DataFrame(result.get("graph4", {}).get("clustered_data", []))
    # Find the cluster label dynamically
    cluster_label = None
    for col in clustered_data.columns:
        if "Cluster" in col:
            cluster_label = col
            break

    if cluster_label is None:
        raise PreventUpdate

    # Compute anomalies
    anomalies = compute_anomalies(clustered_data, cluster_label, num_anomalies)

    if anomalies.empty:
        raise PreventUpdate

    # Prepare data for Dash DataTable
    data_table = anomalies.to_dict("records")
    columns = [{"name": i, "id": i} for i in anomalies.columns]

    return data_table, columns


# Run the Dash app
if __name__ == "__main__":
    app.run_server(debug=True)
