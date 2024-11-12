// src/app/chat/components/analyzeReport/RandomForestVisualization.js

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

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

// Define styles using Material-UI's makeStyles
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
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
function RegressorVisualization({ result, explanation }) {
  const classes = useStyles();

  // Destructure explanation with default values
  const {
    overview = {},
    key_findings = [],
    recommendations = {},
    visualizations = [],
    report_title = "Regression Model Analysis Report",
    "x-axis_title": xAxisTitle = "",
    "x-axis_description": xAxisDescription = "",
    "y-axis_title": yAxisTitle = "",
    "y-axis_description": yAxisDescription = "",
  } = explanation;

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

  // Render Regression Metrics Table
  const renderRegressionMetrics = () => {
    const mse = result.mse;
    const r2 = result.r2;

    if (typeof mse !== "number" || typeof r2 !== "number") {
      console.error("Invalid regression metrics:", mse, r2);
      return null;
    }

    const metrics = [
      {
        Metric: "Mean Squared Error (MSE)",
        Value: mse.toFixed(4),
      },
      {
        Metric: "R² Score",
        Value: r2.toFixed(4),
      },
    ];

    const columns = [
      { field: "Metric", headerName: "Metric", flex: 1 },
      { field: "Value", headerName: "Value", flex: 1 },
    ];

    return (
      <div className={classes.plotContainer}>
        <Typography variant="h6" gutterBottom>
          Regression Metrics
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
          <strong>R² Score:</strong> {r2.toFixed(4)}
        </Typography>
      </div>
    );
  };

  // Render Actual vs. Predicted Scatter Plot
  const renderActualVsPredictedScatter = () => {
    const { y_test, y_pred, identifier } = result.graph2;

    if (
      !Array.isArray(y_test) ||
      !Array.isArray(y_pred) ||
      !Array.isArray(identifier)
    ) {
      console.error("Invalid or missing data in graph2:", result.graph2);
      return null;
    }

    const df_scatter = identifier.map((id, index) => ({
      Identifier: id,
      Actual: y_test[index],
      Predicted: y_pred[index],
      Residual: y_test[index] - y_pred[index],
    }));

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              type: "scatter",
              mode: "markers",
              x: df_scatter.map((item) => item.Actual),
              y: df_scatter.map((item) => item.Predicted),
              text: df_scatter.map(
                (item) =>
                  `ID: ${item.Identifier}<br>Residual: ${item.Residual.toFixed(
                    2
                  )}`
              ),
              marker: { color: "blue", size: 8, opacity: 0.6 },
              hovertemplate:
                "%{text}<br>Actual: %{x}<br>Predicted: %{y}<extra></extra>",
            },
            {
              type: "scatter",
              mode: "lines",
              x: [
                Math.min(...y_test, ...y_pred),
                Math.max(...y_test, ...y_pred),
              ],
              y: [
                Math.min(...y_test, ...y_pred),
                Math.max(...y_test, ...y_pred),
              ],
              name: "Perfect Prediction",
              line: { color: "red", dash: "dash" },
            },
          ]}
          layout={{
            title: visualizations[1]?.title || "Actual vs. Predicted Values",
            xaxis: {
              title: "Actual Values",
              automargin: true,
            },
            yaxis: {
              title: "Predicted Values",
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

  // Render Residuals Scatter Plot
  const renderResidualsPlot = () => {
    const { y_test, y_pred, identifier } = result.graph2;

    if (
      !Array.isArray(y_test) ||
      !Array.isArray(y_pred) ||
      !Array.isArray(identifier)
    ) {
      console.error("Invalid or missing data in graph2:", result.graph2);
      return null;
    }

    const residuals = y_test.map((actual, index) => actual - y_pred[index]);

    const df_residual = identifier.map((id, index) => ({
      Identifier: id,
      Residual: residuals[index],
    }));

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              type: "scatter",
              mode: "markers",
              x: df_residual.map((item) => item.Identifier),
              y: df_residual.map((item) => item.Residual),
              text: df_residual.map(
                (item) =>
                  `ID: ${item.Identifier}<br>Residual: ${item.Residual.toFixed(2)}`
              ),
              marker: { color: "green", size: 8, opacity: 0.6 },
              hovertemplate: "ID: %{x}<br>Residual: %{y}<extra></extra>",
            },
            {
              type: "scatter",
              mode: "lines",
              x: [Math.min(...identifier), Math.max(...identifier)],
              y: [0, 0],
              name: "Zero Residual",
              line: { color: "red", dash: "dash" },
            },
          ]}
          layout={{
            title: "Residuals of Predictions",
            xaxis: {
              title: "Member Identifier",
              automargin: true,
            },
            yaxis: {
              title: "Residual (Actual - Predicted)",
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

  // Render Predictions Overview Table
  const renderPredictionsTable = () => {
    const { y_test, y_pred, identifier } = result.graph2;

    if (
      !Array.isArray(y_test) ||
      !Array.isArray(y_pred) ||
      !Array.isArray(identifier)
    ) {
      console.error("Invalid or missing data in graph2:", result.graph2);
      return null;
    }

    const data_table = identifier.map((id, index) => ({
      id: index,
      Identifier: id,
      Actual: y_test[index],
      Predicted: y_pred[index],
      Residual: (y_test[index] - y_pred[index]).toFixed(2),
    }));

    const columns = [
      { field: "Identifier", headerName: "Identifier", flex: 1 },
      { field: "Actual", headerName: "Actual", flex: 1 },
      { field: "Predicted", headerName: "Predicted", flex: 1 },
      { field: "Residual", headerName: "Residual", flex: 1 },
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
          getRowClassName={(params) => {
            if (params.row.Residual > 1.0) return "overestimation";
            if (params.row.Residual < -1.0) return "underestimation";
            return "";
          }}
        />
        {/* Apply conditional styles */}
        <style>
          {`
            .overestimation {
              background-color: #FFCCCC;
              color: black;
            }
            .underestimation {
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
          {report_title || "Regression Model Analysis Report"}
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

      {/* Regression Metrics */}
      {visualizations.length > 0 && renderRegressionMetrics()}

      {/* Actual vs Predicted Scatter Plot */}
      {visualizations.length > 0 && renderActualVsPredictedScatter()}

      {/* Residuals Plot */}
      {visualizations.length > 0 && renderResidualsPlot()}

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
RegressorVisualization.propTypes = {
  result: PropTypes.shape({
    model: PropTypes.string.isRequired,
    n_estimators: PropTypes.number,
    max_depth: PropTypes.string,
    mse: PropTypes.number.isRequired,
    r2: PropTypes.number.isRequired,
    graph1: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      feature_importances: PropTypes.arrayOf(PropTypes.number).isRequired,
      feature_names: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    graph2: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      y_test: PropTypes.arrayOf(PropTypes.number).isRequired,
      y_pred: PropTypes.arrayOf(PropTypes.number).isRequired,
      identifier: PropTypes.arrayOf(PropTypes.number).isRequired,
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

export default RegressorVisualization;
