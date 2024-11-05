# /visualize/visualization_case3.py

import json
import os
import sys
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from dash import Dash, dcc, html, Input, Output, State, dash_table
from dash.exceptions import PreventUpdate

import base64

# Initialize the Dash app
app = Dash(__name__)
app.title = "K-Means Clustering Results Dashboard"

# Define the layout of the app
app.layout = html.Div([
    html.H1("K-Means Clustering Results Dashboard", style={'textAlign': 'center'}),
    
    html.Div([
        dcc.Upload(
            id='upload-json',
            children=html.Div([
                'Drag and Drop or ',
                html.A('Select JSON File')
            ]),
            style={
                'width': '50%',
                'height': '60px',
                'lineHeight': '60px',
                'borderWidth': '2px',
                'borderStyle': 'dashed',
                'borderRadius': '5px',
                'textAlign': 'center',
                'margin': '10px auto'
            },
            multiple=False
        ),
    ]),
    
    html.Div(id='output-data-upload'),
    
    html.Div(id='plots-container', style={'display': 'none'}, children=[
        html.H2("Cluster Distribution"),
        dcc.Graph(id='cluster-distribution'),
        
        html.H2("Cluster Scatter Plot"),
        dcc.Graph(id='cluster-scatter'),
        
        html.H2("Clustered Data Overview"),
        dash_table.DataTable(
            id='clustered-data-table',
            page_size=20,
            style_table={'overflowX': 'auto'},
            style_cell={
                'minWidth': '100px', 'width': '150px', 'maxWidth': '180px',
                'overflow': 'hidden',
                'textOverflow': 'ellipsis',
                'textAlign': 'left'
            },
            style_header={
                'backgroundColor': 'paleturquoise',
                'fontWeight': 'bold'
            },
            filter_action='native',
            sort_action='native',
            sort_mode='multi',
            column_selectable='single',
            row_selectable='multi',
            selected_columns=[],
            selected_rows=[],
        ),
        
        # Conditional Rendering for Anomaly Detection
        html.Div(id='anomaly-section', children=[
            html.H2("Anomaly Distribution"),
            dcc.Graph(id='anomaly-distribution'),
            
            html.H2("Anomaly Scatter Plot"),
            dcc.Graph(id='anomaly-scatter'),
            
            html.H2("Anomalies Overview"),
            dash_table.DataTable(
                id='anomalies-table',
                page_size=20,
                style_table={'overflowX': 'auto'},
                style_cell={
                    'minWidth': '100px', 'width': '150px', 'maxWidth': '180px',
                    'overflow': 'hidden',
                    'textOverflow': 'ellipsis',
                    'textAlign': 'left'
                },
                style_header={
                    'backgroundColor': 'paleturquoise',
                    'fontWeight': 'bold'
                },
                filter_action='native',
                sort_action='native',
                sort_mode='multi',
                column_selectable='single',
                row_selectable='multi',
                selected_columns=[],
                selected_rows=[],
            )
        ], style={'display': 'none'}),  # Initially hidden
        
    ]),
    
    html.Div(id='error-message', style={'color': 'red', 'textAlign': 'center', 'marginTop': '20px'})
])

def parse_contents(contents, filename):
    """
    Parses the uploaded JSON file content.

    Parameters:
    - contents (str): The content of the uploaded file.
    - filename (str): The name of the uploaded file.

    Returns:
    - data (dict): Parsed JSON data.
    """
    content_type, content_string = contents.split(',')
    decoded = base64.b64decode(content_string)
    try:
        if 'json' in filename:
            data = json.loads(decoded)
            return data
        else:
            return None
    except Exception as e:
        print(e)
        return None

@app.callback(
    Output('output-data-upload', 'children'),
    Output('plots-container', 'style'),
    Output('anomaly-section', 'style'),
    Output('error-message', 'children'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_output(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None:
        return None, {'display': 'none'}, {'display': 'none'}, "파일을 파싱하는 중 오류가 발생했습니다."
    
    # Check status
    status = data.get("status", "")
    if status != "success":
        return None, {'display': 'none'}, {'display': 'none'}, f"업로드된 JSON의 상태가 'success'가 아닙니다. 상태: {status}"
    
    # Check 'result' field
    result = data.get("result", {})
    if not isinstance(result, dict):
        return None, {'display': 'none'}, {'display': 'none'}, "'result' 필드가 딕셔너리가 아닙니다."
    
    # Check model type
    model = result.get("model", "").lower()
    if "kmeans" not in model:
        return None, {'display': 'none'}, {'display': 'none'}, "현재 애플리케이션은 K-Means 클러스터링 결과만 지원합니다."
    
    # Determine if it's anomaly detection
    is_anomaly = "anomalydetection" in model
    
    # If everything is fine, display the plots
    anomaly_style = {'display': 'block'} if is_anomaly else {'display': 'none'}
    return None, {'display': 'block'}, anomaly_style, ""

@app.callback(
    Output('cluster-distribution', 'figure'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_cluster_distribution(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    graph1 = result.get("graph1", {})
    if graph1.get("graph_type") != "bar":
        raise PreventUpdate
    
    # Assuming 'cluster_label' is known, but it's safer to extract it
    # Here, we extract it by finding the key ending with 'Cluster' or 'Cluster_Segmentation' or 'Cluster_Anomaly'
    cluster_label = None
    for key in result.keys():
        if key.startswith("Cluster"):
            cluster_label = key
            break
    if cluster_label is None:
        raise PreventUpdate
    
    distribution = result.get("clustered_data", [])
    df_distribution = pd.DataFrame(distribution)
    distribution_counts = df_distribution[cluster_label].value_counts().reset_index()
    distribution_counts.columns = [cluster_label, "Count"]
    
    fig = px.bar(
        distribution_counts,
        x=cluster_label,
        y="Count",
        title="클러스터별 데이터 포인트 수",
        labels={cluster_label: "클러스터", "Count": "데이터 포인트 수"},
    )
    
    return fig

@app.callback(
    Output('cluster-scatter', 'figure'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_cluster_scatter(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    graph2 = result.get("graph2", {})
    if graph2.get("graph_type") != "scatter":
        raise PreventUpdate
    
    # Extract the scatter plot data
    fig = go.Figure(graph2.get("data", {}))
    fig.update_layout(title="클러스터링 결과 산점도 (PCA 기반)")
    
    return fig

@app.callback(
    Output('anomaly-distribution', 'figure'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
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
    
    graph3 = result.get("graph3", {})
    if graph3.get("graph_type") != "bar":
        raise PreventUpdate
    
    anomalies = result.get("anomalies", [])
    if not anomalies:
        raise PreventUpdate
    
    df_anomalies = pd.DataFrame(anomalies)
    # Assuming anomalies have 'Cluster_Anomaly' as cluster label
    cluster_label = "Cluster_Anomaly"
    anomaly_counts = df_anomalies[cluster_label].value_counts().reset_index()
    anomaly_counts.columns = [cluster_label, "Count"]
    
    fig = px.bar(
        anomaly_counts,
        x=cluster_label,
        y="Count",
        title="클러스터별 이상치 수",
        labels={cluster_label: "클러스터", "Count": "이상치 수"},
    )
    
    return fig

@app.callback(
    Output('anomaly-scatter', 'figure'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_anomaly_scatter(contents, filename):
    # This callback is only relevant if anomalies are present
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    model = result.get("model", "").lower()
    if "anomalydetection" not in model:
        raise PreventUpdate
    
    graph4 = result.get("graph4", {})
    if graph4.get("graph_type") != "scatter":
        raise PreventUpdate
    
    # Extract the scatter plot data for anomalies
    fig = go.Figure(graph4.get("data", {}))
    fig.update_layout(title="이상치 산점도 (PCA 기반)")
    
    return fig

@app.callback(
    Output('clustered-data-table', 'data'),
    Output('clustered-data-table', 'columns'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_clustered_data_table(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    clustered_data = result.get("clustered_data", [])
    
    if not clustered_data:
        raise PreventUpdate
    
    df_clustered = pd.DataFrame(clustered_data)
    
    # Prepare data for Dash DataTable
    data_table = df_clustered.head(100).to_dict('records')  # Display first 100 records
    columns = [{"name": i, "id": i} for i in df_clustered.columns]
    
    return data_table, columns

@app.callback(
    Output('anomalies-table', 'data'),
    Output('anomalies-table', 'columns'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_anomalies_table(contents, filename):
    # This callback is only relevant if anomalies are present
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    model = result.get("model", "").lower()
    if "anomalydetection" not in model:
        raise PreventUpdate
    
    anomalies = result.get("anomalies", [])
    if not anomalies:
        raise PreventUpdate
    
    df_anomalies = pd.DataFrame(anomalies)
    
    # Prepare data for Dash DataTable
    data_table = df_anomalies.head(100).to_dict('records')  # Display first 100 anomalies
    columns = [{"name": i, "id": i} for i in df_anomalies.columns]
    
    return data_table, columns

# Run the Dash app
if __name__ == '__main__':
    app.run_server(debug=True)
