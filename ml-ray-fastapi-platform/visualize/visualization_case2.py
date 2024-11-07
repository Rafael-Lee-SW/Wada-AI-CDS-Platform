# visualize/visualization_case2.py

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
app.title = "Random Forest Classification Results Dashboard"

# Define the layout of the app
app.layout = html.Div([
    html.H1("Random Forest Classification Results Dashboard", style={'textAlign': 'center'}),
    
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
        html.H2("Feature Importances"),
        dcc.Graph(id='feature-importances'),
        
        html.H2("Classification Metrics"),
        dash_table.DataTable(
            id='classification-metrics',
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
        ),
        html.Div(id='accuracy-display', style={'margin': '10px 0'}),
        
        html.H2("Confusion Matrix"),
        dcc.Graph(id='confusion-matrix'),
        
        html.H2("Classification Probabilities"),
        html.Div([
            html.Label("Set Classification Threshold:"),
            dcc.Slider(
                id='threshold-slider',
                min=0,
                max=1,
                step=0.01,
                value=0.5,
                marks={i/10: f"{i/10}" for i in range(0, 11)}
            )
        ], style={'width': '50%', 'margin': '0 auto'}),
        dcc.Graph(id='classification-probabilities'),
        
        html.H2("Predictions Overview"),
        dash_table.DataTable(
            id='predictions-table',
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
    Output('error-message', 'children'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_output(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None:
        return None, {'display': 'none'}, "파일을 파싱하는 중 오류가 발생했습니다."
    
    # Check status
    status = data.get("status", "")
    if status != "success":
        return None, {'display': 'none'}, f"업로드된 JSON의 상태가 'success'가 아닙니다. 상태: {status}"
    
    # Check 'result' field
    result = data.get("result", {})
    if not isinstance(result, dict):
        return None, {'display': 'none'}, "'result' 필드가 딕셔너리가 아닙니다."
    
    # Check model type
    model = result.get("model", "").lower()
    if "classifier" not in model:
        return None, {'display': 'none'}, "현재 애플리케이션은 분류 모델 결과만 지원합니다."
    
    # If everything is fine, display the plots
    return None, {'display': 'block'}, ""

@app.callback(
    Output('feature-importances', 'figure'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_feature_importances(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    graph1 = result.get("graph1", {})
    if graph1.get("graph_type") != "bar":
        raise PreventUpdate
    
    feature_names = graph1.get("feature_names", [])
    importances = graph1.get("feature_importances", [])
    
    if not feature_names or not importances:
        raise PreventUpdate
    
    df_importances = pd.DataFrame({
        'Feature': feature_names,
        'Importance': importances
    }).sort_values(by='Importance', ascending=True)  # Ascending for better visualization
    
    fig = px.bar(
        df_importances,
        x='Importance',
        y='Feature',
        orientation='h',
        title="Feature Importances",
        labels={'Importance': '중요도', 'Feature': '특성'},
        height=600,
    )
    fig.update_layout(yaxis=dict(autorange="reversed"))
    return fig

@app.callback(
    Output('classification-metrics', 'data'),
    Output('classification-metrics', 'columns'),
    Output('accuracy-display', 'children'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_classification_metrics(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    accuracy = result.get("accuracy", None)
    graph3 = result.get("graph3", {})
    report = graph3.get("classification_report", {})
    
    if accuracy is None or not isinstance(report, dict):
        raise PreventUpdate
    
    # Exclude 'accuracy', 'macro avg', 'weighted avg'
    metrics = {k: v for k, v in report.items() if k not in ['accuracy', 'macro avg', 'weighted avg']}
    df_metrics = pd.DataFrame(metrics).transpose().reset_index()
    df_metrics.rename(columns={'index': 'Class'}, inplace=True)
    
    # Prepare data for Dash DataTable
    data_table = df_metrics.to_dict('records')
    columns = [{"name": i, "id": i} for i in df_metrics.columns]
    
    # Display accuracy
    accuracy_text = f"**정확도 (Accuracy):** {accuracy:.4f}"
    
    return data_table, columns, accuracy_text

@app.callback(
    Output('confusion-matrix', 'figure'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_confusion_matrix(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    graph4 = result.get("graph4", {})
    confusion = graph4.get("confusion_matrix", [])
    labels = graph4.get("labels", [])
    
    if not confusion or not isinstance(confusion, list):
        raise PreventUpdate
    
    if not labels:
        raise PreventUpdate
    
    confusion_np = pd.DataFrame(confusion)
    
    fig = px.imshow(
        confusion_np,
        text_auto=True,
        x=labels,
        y=labels,
        color_continuous_scale='Blues',
        title="Confusion Matrix",
        labels={'x': '예측', 'y': '실제'},
        height=600,
    )
    fig.update_layout(
        yaxis=dict(autorange="reversed")
    )
    return fig

@app.callback(
    Output('classification-probabilities', 'figure'),
    Input('threshold-slider', 'value'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_classification_probabilities(threshold, contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    graph2 = result.get("graph2", {})
    
    if graph2.get("graph_type") != "probability":
        raise PreventUpdate
    
    y_proba = graph2.get("y_proba", [])
    identifiers = graph2.get("identifier", [])
    
    if not y_proba or not identifiers:
        raise PreventUpdate
    
    # Assuming binary classification, extract probability for class '1'
    class_probabilities = [prob[1] for prob in y_proba]
    
    df_prob = pd.DataFrame({
        'Identifier': identifiers,
        'Probability_Class_1': class_probabilities
    })
    
    # Sort by probability for better visualization
    df_prob_sorted = df_prob.sort_values(by='Probability_Class_1', ascending=False).reset_index(drop=True)
    
    # Determine classification based on threshold
    df_prob_sorted['Classification'] = df_prob_sorted['Probability_Class_1'].apply(lambda x: 'Class 1' if x >= threshold else 'Class 0')
    
    # Assign colors based on classification
    color_map = {'Class 1': 'green', 'Class 0': 'orange'}
    df_prob_sorted['Color'] = df_prob_sorted['Classification'].map(color_map)
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=df_prob_sorted['Identifier'],
        y=df_prob_sorted['Probability_Class_1'],
        mode='markers',
        marker=dict(
            size=10,
            color=df_prob_sorted['Color'],
            opacity=0.7
        ),
        hovertemplate=
            "Identifier: %{x}<br>" +
            "Probability Class 1: %{y:.2f}<br>" +
            "Classification: %{text}<br>" +
            "<extra></extra>",
        text=df_prob_sorted['Classification']
    ))
    
    # Add threshold line
    fig.add_trace(go.Scatter(
        x=[df_prob_sorted['Identifier'].min(), df_prob_sorted['Identifier'].max()],
        y=[threshold, threshold],
        mode='lines',
        line=dict(color='red', dash='dash'),
        name=f'Threshold = {threshold}',
        hoverinfo='none'
    ))
    
    fig.update_layout(
        title="Classification Probabilities per Member",
        xaxis_title="Member Identifier",
        yaxis_title="Probability of Class 1",
        template="plotly_white",
        hovermode="closest",
        height=600
    )
    
    return fig

@app.callback(
    Output('predictions-table', 'data'),
    Output('predictions-table', 'columns'),
    Input('upload-json', 'contents'),
    State('upload-json', 'filename')
)
def update_predictions_table(contents, filename):
    if contents is None:
        raise PreventUpdate
    
    data = parse_contents(contents, filename)
    
    if data is None or data.get("status", "") != "success":
        raise PreventUpdate
    
    result = data.get("result", {})
    graph2 = result.get("graph2", {})
    y_test = graph2.get("y_test", [])
    y_pred = graph2.get("y_pred", [])
    identifiers = graph2.get("identifier", [])
    
    if not (y_test and y_pred and identifiers):
        raise PreventUpdate
    
    if not (len(y_test) == len(y_pred) == len(identifiers)):
        raise PreventUpdate
    
    df_predictions = pd.DataFrame({
        "Identifier": identifiers,
        "Actual": y_test,
        "Predicted": y_pred
    })
    
    data_table = df_predictions.to_dict('records')
    columns = [{"name": i, "id": i} for i in df_predictions.columns]
    
    return data_table, columns

# Run the Dash app
if __name__ == '__main__':
    app.run_server(debug=True)
