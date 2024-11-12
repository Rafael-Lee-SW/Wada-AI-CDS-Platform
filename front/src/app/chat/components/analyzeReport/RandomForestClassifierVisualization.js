// src/app/chat/components/analyzeReport/RandomForestClassifierVisualization.js

import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import {
  Slider,
  Typography,
  Card,
  CardContent,
  Box,
  Container,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
  container: {
    padding: "20px",
  },
  sectionTitle: {
    marginTop: "20px",
    marginBottom: "10px",
  },
  plotContainer: {
    marginTop: "20px",
    marginBottom: "20px",
  },
  card: {
    marginBottom: "10px",
  },
  cardTitle: {
    fontWeight: "bold",
  },
  bodyText: {
    fontSize: "14px",
  },
});

function ClassifierVisualization({ result, explanation }) {
  const classes = useStyles();

  // Destructure explanation with default empty objects/arrays
  const {
    overview = {},
    key_findings = [],
    recommendations = {},
    visualizations = [],
    report_title = "Classification Model Analysis Report",
    "x-axis_title": xAxisTitle = "",
    "x-axis_description": xAxisDescription = "",
    "y-axis_title": yAxisTitle = "",
    "y-axis_description": yAxisDescription = "",
  } = explanation;

  // State for threshold slider
  const [threshold, setThreshold] = useState(0.5);

  // Handle threshold slider change
  const handleThresholdChange = (event, value) => {
    setThreshold(value);
  };

  // Render Feature Importances Bar Chart
  const renderFeatureImportances = () => {
    const featureImportances = result.graph1?.feature_importances;
    const featureNames = result.graph1?.feature_names;

    if (!Array.isArray(featureImportances) || !Array.isArray(featureNames)) {
      console.error("Invalid feature importances data:", featureImportances, featureNames);
      return null;
    }

    const df_importances = featureNames.map((feature, index) => ({
      Feature: feature,
      Importance: featureImportances[index],
    }));

    // Sort ascending for better visualization
    df_importances.sort((a, b) => a.Importance - b.Importance);

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              type: "bar",
              x: df_importances.map((item) => item.Importance),
              y: df_importances.map((item) => item.Feature),
              orientation: "h",
              marker: {
                color: "rgba(55,128,191,0.7)",
                width: 1,
              },
            },
          ]}
          layout={{
            title: visualizations[0]?.title || "Feature Importances",
            xaxis: {
              title: "Importance",
              automargin: true,
            },
            yaxis: {
              title: "Feature",
              automargin: true,
              categoryorder: "total ascending",
            },
            margin: { l: 150, r: 50, t: 50, b: 50 },
            height: 600,
            template: "plotly_white",
          }}
          config={{ responsive: true }}
        />
        {/* Axis Descriptions */}
        {xAxisDescription && (
          <Typography variant="body2" gutterBottom>
            {xAxisDescription}
          </Typography>
        )}
        {yAxisDescription && (
          <Typography variant="body2" gutterBottom>
            {yAxisDescription}
          </Typography>
        )}
      </div>
    );
  };

  // Render Classification Metrics Table
  const renderClassificationMetrics = () => {
    const classification_report = result.graph3?.classification_report;

    if (!classification_report) {
      console.error("Missing classification_report in graph3");
      return null;
    }

    const metrics = Object.keys(classification_report)
      .filter((key) => !["accuracy", "macro avg", "weighted avg"].includes(key))
      .map((key) => ({
        Class: key,
        Precision: classification_report[key].precision.toFixed(3),
        Recall: classification_report[key].recall.toFixed(3),
        "F1-Score": classification_report[key]["f1-score"].toFixed(3),
        Support: classification_report[key].support,
      }));

    const columns = [
      { field: "Class", headerName: "Class", flex: 1 },
      { field: "Precision", headerName: "Precision", flex: 1 },
      { field: "Recall", headerName: "Recall", flex: 1 },
      { field: "F1-Score", headerName: "F1-Score", flex: 1 },
      { field: "Support", headerName: "Support", flex: 1 },
    ];

    return (
      <div className={classes.plotContainer}>
        <Typography variant="h6" gutterBottom>
          Classification Metrics
        </Typography>
        <DataGrid
          rows={metrics.map((m, index) => ({ id: index, ...m }))}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          autoHeight
          disableSelectionOnClick
          hideFooter
        />
        <Typography variant="body1" gutterBottom>
          <strong>Accuracy:</strong> {result.accuracy.toFixed(3)}
        </Typography>
      </div>
    );
  };

  // Render Confusion Matrix Heatmap
  const renderConfusionMatrix = () => {
    const confusion_matrix = result.graph4?.confusion_matrix;
    const labels = result.graph4?.labels;

    if (!Array.isArray(confusion_matrix) || !Array.isArray(labels)) {
      console.error("Invalid confusion_matrix or labels in graph4:", confusion_matrix, labels);
      return null;
    }

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              z: confusion_matrix,
              x: labels,
              y: labels,
              type: "heatmap",
              colorscale: "Blues",
              hoverongaps: false,
              text: confusion_matrix.map((row) => row.join(", ")),
              texttemplate: "%{text}",
              textfont: {
                color: "white",
              },
            },
          ]}
          layout={{
            title: "Confusion Matrix",
            xaxis: {
              title: "Predicted",
              automargin: true,
            },
            yaxis: {
              title: "Actual",
              automargin: true,
            },
            height: 600,
            template: "plotly_white",
          }}
          config={{ responsive: true }}
        />
      </div>
    );
  };

  // Render Classification Probabilities Scatter Plot
  const renderClassificationProbabilities = () => {
    const graph2 = result.graph2;

    if (
      !graph2 ||
      !Array.isArray(graph2.y_proba) ||
      !Array.isArray(graph2.identifier) ||
      !Array.isArray(graph2.y_test) ||
      !Array.isArray(graph2.y_pred)
    ) {
      console.error("Invalid or missing graph2 data:", graph2);
      return null;
    }

    const { y_proba, identifier, y_test, y_pred } = graph2;

    // Calculate probabilities for class '1'
    const probabilities = y_proba.map((prob) => prob[1]);

    // Create DataFrame
    const df_prob = identifier.map((id, index) => ({
      Identifier: id,
      Probability_Class_1: probabilities[index],
      Actual: y_test[index],
      Predicted: y_pred[index],
    }));

    // Sort by probability
    df_prob.sort((a, b) => b.Probability_Class_1 - a.Probability_Class_1);

    return (
      <div className={classes.plotContainer}>
        <Typography variant="h6" gutterBottom>
          Classification Probabilities per Member
        </Typography>
        <Plot
          data={[
            {
              type: "scatter",
              mode: "markers",
              x: df_prob.map((item) => item.Identifier),
              y: df_prob.map((item) => item.Probability_Class_1),
              text: df_prob.map(
                (item) =>
                  `ID: ${item.Identifier}<br>Probability Class 1: ${item.Probability_Class_1.toFixed(
                    2
                  )}<br>Classification: ${
                    item.Probability_Class_1 >= threshold ? "Class 1" : "Class 0"
                  }`
              ),
              marker: {
                color: df_prob.map((item) =>
                  item.Probability_Class_1 >= threshold ? "red" : "blue"
                ),
                size: 8,
                opacity: 0.6,
              },
              hovertemplate: "%{text}<extra></extra>",
            },
            {
              type: "scatter",
              mode: "lines",
              x: [Math.min(...identifier), Math.max(...identifier)],
              y: [threshold, threshold],
              name: `Threshold = ${threshold}`,
              line: { color: "black", dash: "dash" },
            },
          ]}
          layout={{
            title: visualizations[1]?.title || "Classification Probabilities",
            xaxis: {
              title: "Member Identifier",
              automargin: true,
            },
            yaxis: {
              title: "Probability of Class 1",
              automargin: true,
              range: [0, 1],
            },
            height: 600,
            template: "plotly_white",
          }}
          config={{ responsive: true }}
        />
        {/* Threshold Slider */}
        <Box mt={2}>
          <Typography id="threshold-slider" gutterBottom>
            Set Classification Threshold: {threshold}
          </Typography>
          <Slider
            value={threshold}
            onChange={handleThresholdChange}
            aria-labelledby="threshold-slider"
            valueLabelDisplay="auto"
            step={0.01}
            marks
            min={0}
            max={1}
          />
        </Box>
      </div>
    );
  };

  // Render Predictions Overview Table
  const renderPredictionsTable = () => {
    const graph2 = result.graph2;

    if (
      !graph2 ||
      !Array.isArray(graph2.y_test) ||
      !Array.isArray(graph2.y_pred) ||
      !Array.isArray(graph2.identifier)
    ) {
      console.error("Invalid or missing graph2 data for predictions table:", graph2);
      return null;
    }

    const { y_test, y_pred, identifier } = graph2;

    const data_table = identifier.map((id, index) => ({
      id: index,
      Identifier: id,
      Actual: y_test[index],
      Predicted: y_pred[index],
    }));

    const columns = [
      { field: "Identifier", headerName: "Identifier", flex: 1 },
      { field: "Actual", headerName: "Actual", flex: 1 },
      { field: "Predicted", headerName: "Predicted", flex: 1 },
    ];

    return (
      <div className={classes.plotContainer}>
        <Typography variant="h6" gutterBottom>
          Predictions Overview
        </Typography>
        <DataGrid
          rows={data_table}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20, 50, 100]}
          checkboxSelection
          disableSelectionOnClick
          className={classes.dataGrid}
          style={{ height: 500, width: "100%" }}
          getRowClassName={(params) =>
            params.row.Predicted === 1 ? "predicted-class1" : "predicted-class0"
          }
        />
        {/* Apply conditional styles */}
        <style>
          {`
            .predicted-class1 {
              background-color: #FFCCCC;
              color: black;
            }
            .predicted-class0 {
              background-color: #CCCCFF;
              color: black;
            }
          `}
        </style>
      </div>
    );
  };

  // Final Return
  return (
    <Container maxWidth="lg" className={classes.container}>
      {/* Report Title */}
      <Box my={4}>
        <Typography variant="h3" align="center" gutterBottom>
          {report_title || "Classification Model Analysis Report"}
        </Typography>
      </Box>

      {/* Analysis Overview */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom>
          Overview
        </Typography>
        <Typography variant="body1" gutterBottom>
          {overview.analysis_purpose}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {overview.data_description}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {overview.models_used?.model_description}
        </Typography>
      </Box>

      {/* Feature Importances */}
      {visualizations.length > 0 && renderFeatureImportances()}

      {/* Classification Metrics */}
      {visualizations.length > 0 && renderClassificationMetrics()}

      {/* Confusion Matrix */}
      {visualizations.length > 0 && renderConfusionMatrix()}

      {/* Classification Probabilities */}
      {visualizations.length > 0 && renderClassificationProbabilities()}

      {/* Predictions Overview Table */}
      {visualizations.length > 0 && renderPredictionsTable()}

      {/* Key Findings */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom>
          Key Findings
        </Typography>
        {key_findings.map((finding, index) => (
          <Card key={index} variant="outlined" className={classes.card}>
            <CardContent>
              <Typography variant="h6" className={classes.cardTitle}>
                {finding.finding}
              </Typography>
              <Typography variant="body1" className={classes.bodyText}>
                <strong>Impact:</strong> {finding.impact}
              </Typography>
              <Typography variant="body1" className={classes.bodyText}>
                <strong>Recommendation:</strong> {finding.recommendation}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recommendations */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom>
          Recommendations
        </Typography>
        {recommendations.immediate_actions &&
          recommendations.immediate_actions.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Immediate Actions
              </Typography>
              <ul>
                {recommendations.immediate_actions.map((action, index) => (
                  <li key={index}>
                    <Typography variant="body1">{action}</Typography>
                  </li>
                ))}
              </ul>
            </>
          )}
        {recommendations.further_analysis &&
          recommendations.further_analysis.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Further Analysis
              </Typography>
              <ul>
                {recommendations.further_analysis.map((action, index) => (
                  <li key={index}>
                    <Typography variant="body1">{action}</Typography>
                  </li>
                ))}
              </ul>
            </>
          )}
      </Box>
    </Container>
  );
}

// Define prop types for type checking
ClassifierVisualization.propTypes = {
  result: PropTypes.shape({
    model: PropTypes.string.isRequired,
    n_estimators: PropTypes.number,
    max_depth: PropTypes.string,
    accuracy: PropTypes.number.isRequired,
    graph1: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      feature_importances: PropTypes.arrayOf(PropTypes.number).isRequired,
      feature_names: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    graph2: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      y_test: PropTypes.arrayOf(PropTypes.number).isRequired,
      y_pred: PropTypes.arrayOf(PropTypes.number).isRequired,
      y_proba: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
        .isRequired,
      identifier: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
    graph3: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      classification_report: PropTypes.object.isRequired,
    }).isRequired,
    graph4: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      confusion_matrix: PropTypes.arrayOf(
        PropTypes.arrayOf(PropTypes.number)
      ).isRequired,
      labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
  }).isRequired,
  explanation: PropTypes.shape({
    overview: PropTypes.shape({
      analysis_purpose: PropTypes.string.isRequired,
      data_description: PropTypes.string.isRequired,
      models_used: PropTypes.shape({
        model_name: PropTypes.string,
        model_description: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    key_findings: PropTypes.arrayOf(
      PropTypes.shape({
        finding: PropTypes.string.isRequired,
        impact: PropTypes.string.isRequired,
        recommendation: PropTypes.string.isRequired,
      })
    ).isRequired,
    recommendations: PropTypes.shape({
      immediate_actions: PropTypes.arrayOf(PropTypes.string),
      further_analysis: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    visualizations: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        type: PropTypes.string,
        description: PropTypes.string,
        insights: PropTypes.string,
      })
    ).isRequired,
    report_title: PropTypes.string,
    "x-axis_title": PropTypes.string,
    "x-axis_description": PropTypes.string,
    "y-axis_title": PropTypes.string,
    "y-axis_description": PropTypes.string,
  }).isRequired,
};

export default ClassifierVisualization;
