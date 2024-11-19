// src/app/chat/components/analyzeReport/NeuralNetworkVisualization.js

import React from "react";
import dynamic from "next/dynamic";
import {
  Typography,
  Card,
  CardContent,
  Box,
  Container,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PropTypes from "prop-types";
import useAnalyzingStyles from "/styles/analyzingNNStyle.js";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function NeuralNetworkVisualization({ result, explanation }) {
  const classes = useAnalyzingStyles();

  // Destructure graph1, graph2, graph3 directly from result
  const { graph1, graph2, graph3, model, architecture } = result || {};

  const {
    overview,
    model_performance,
    visualizations,
    key_findings,
    recommendations,
    Neural_Network,
  } = explanation || {};

  const renderLossCurve = () => {
    if (!graph1 || !graph1.loss || !graph1.val_loss || !graph1.epochs) {
      return (
        <Typography variant="body2" color="error">
          손실 곡선을 그릴 수 없습니다. 데이터가 없습니다.
        </Typography>
      );
    }

    const lossData = graph1.loss.map((value) => Number(value));
    const valLossData = graph1.val_loss.map((value) => Number(value));
    const epochsData = graph1.epochs.map((value) => Number(value));

    if (
      lossData.some(isNaN) ||
      valLossData.some(isNaN) ||
      epochsData.some(isNaN)
    ) {
      return (
        <Typography variant="body2" color="error">
          손실 곡선을 그릴 수 없습니다. 데이터에 숫자가 아닌 값이 포함되어 있습니다.
        </Typography>
      );
    }

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              x: epochsData,
              y: lossData,
              type: "scatter",
              mode: "lines",
              name: "Training Loss",
              line: { color: "blue" },
            },
            {
              x: epochsData,
              y: valLossData,
              type: "scatter",
              mode: "lines",
              name: "Validation Loss",
              line: { color: "red" },
            },
          ]}
          layout={{
            title: visualizations?.[0]?.title || "손실 곡선",
            xaxis: {
              title: "에포크",
            },
            yaxis: {
              title: "손실 값",
            },
            legend: {
              x: 0,
              y: 1,
              bgcolor: "transparent",
            },
            plot_bgcolor: "#f9f9f9",
            paper_bgcolor: "#f9f9f9",
            height: 400,
            margin: { t: 50, l: 50, r: 50, b: 50 },
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: "#1D1D1F",
            },
          }}
          config={{ responsive: true }}
        />
        {/* Visualization description */}
        {visualizations?.[0]?.description && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.bodyText}
          >
            {visualizations[0].description}
          </Typography>
        )}
        {/* Insights */}
        {visualizations?.[0]?.insights && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.bodyText}
          >
            {visualizations[0].insights}
          </Typography>
        )}
      </div>
    );
  };

  // Render the predictions vs actual scatter plot
  const renderPredictionScatter = () => {
    if (!graph2) return null;

    const { y_test, y_pred, identifiers } = graph2;

    // Check if y_test and y_pred are present
    if (!y_test || !y_pred) {
      return (
        <Typography variant="body2" color="error">
          예측 데이터를 사용할 수 없습니다.
        </Typography>
      );
    }

    // Convert to numbers if they are strings
    const yTestData = y_test.map((value) => Number(value));
    const yPredData = y_pred.map((value) => Number(value));

    // Check for NaN values
    if (yTestData.some(isNaN) || yPredData.some(isNaN)) {
      return (
        <Typography variant="body2" color="error">
          예측 그래프를 그릴 수 없습니다. 데이터에 숫자가 아닌 값이 포함되어 있습니다.
        </Typography>
      );
    }

    // Prepare data for DataGrid
    const rows = yTestData.map((actual, index) => ({
      id: identifiers ? identifiers[index] : index,
      Actual: actual,
      Predicted: yPredData[index],
    }));

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              x: yTestData,
              y: yPredData,
              type: "scatter",
              mode: "markers",
              marker: { color: "blue" },
              text: identifiers,
              hovertemplate:
                "Identifier: %{text}<br>Actual: %{x}<br>Predicted: %{y}<extra></extra>",
            },
            {
              x: [
                Math.min(...yTestData, ...yPredData),
                Math.max(...yTestData, ...yPredData),
              ],
              y: [
                Math.min(...yTestData, ...yPredData),
                Math.max(...yTestData, ...yPredData),
              ],
              type: "scatter",
              mode: "lines",
              line: { dash: "dashdot", color: "gray" },
              name: "Ideal Fit",
            },
          ]}
          layout={{
            title:
              Neural_Network?.Predictions_vs_Actual
                ?.Predictions_vs_Actual_title ||
              "예측 값과 실제 값 비교",
            xaxis: {
              title:
                Neural_Network?.Predictions_vs_Actual?.["x-axis_title"] ||
                "실제 값",
            },
            yaxis: {
              title:
                Neural_Network?.Predictions_vs_Actual?.["y-axis_title"] ||
                "예측 값",
            },
            legend: {
              x: 0,
              y: 1,
              bgcolor: "transparent",
            },
            plot_bgcolor: "#f9f9f9",
            paper_bgcolor: "#f9f9f9",
            height: 500,
            margin: { t: 50, l: 50, r: 50, b: 50 },
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: "#1D1D1F",
            },
          }}
          config={{ responsive: true }}
        />
        {/* Visualization description */}
        {visualizations?.[1]?.description && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.bodyText}
          >
            {visualizations[1].description}
          </Typography>
        )}
        {/* Insights */}
        {visualizations?.[1]?.insights && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.bodyText}
          >
            {visualizations[1].insights}
          </Typography>
        )}
      </div>
    );
  };

  // Render the metrics table
  const renderMetricsTable = () => {
    if (!model_performance?.metrics) return null;

    const columns = [
      {
        field: "metric_name",
        headerName: "성능 지표명",
        flex: 1,
        minWidth: 150,
      },
      {
        field: "metric_value",
        headerName: "지표 값",
        flex: 1,
        minWidth: 150,
        valueFormatter: (params) => {
          const value = Number(params.value);
          return isNaN(value)
            ? "데이터 없음"
            : value.toLocaleString(undefined, { maximumFractionDigits: 4 });
        },
      },
      {
        field: "interpretation",
        headerName: "해석",
        flex: 2,
        minWidth: 300,
      },
    ];

    const rows = model_performance.metrics.map((metric, index) => ({
      id: index,
      ...metric,
    }));

    return (
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          disableSelectionOnClick
          className={classes.dataGrid}
        />
      </div>
    );
  };

  // --- Final return ---
  return (
    <Container maxWidth="lg" className={classes.container}>
      {/* Report Title */}
      <Box my={4}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          className={classes.reportTitle}
        >
          {Neural_Network?.report_title || "Neural Network Regressor 분석 보고서"}
        </Typography>
      </Box>

      {/* Overview */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom className={classes.sectionTitle}>
          {"분석 개요"}
        </Typography>
        <Typography variant="body1" gutterBottom className={classes.bodyText}>
          {overview?.analysis_purpose}
        </Typography>
        <Typography variant="body1" gutterBottom className={classes.bodyText}>
          {overview?.data_description}
        </Typography>
        <Typography variant="body1" gutterBottom className={classes.bodyText}>
          {overview?.models_used?.model_description}
        </Typography>
      </Box>

      {/* Loss Curve */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom className={classes.sectionTitle}>
          {visualizations?.[0]?.title || "손실 곡선"}
        </Typography>
        {renderLossCurve()}
      </Box>

      {/* Predictions vs Actual */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom className={classes.sectionTitle}>
          {Neural_Network?.Predictions_vs_Actual?.Predictions_vs_Actual_title ||
            "예측 값과 실제 값 비교"}
        </Typography>
        {renderPredictionScatter()}
      </Box>

      {/* Metrics Table */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom className={classes.sectionTitle}>
          {"성능 지표"}
        </Typography>
        {renderMetricsTable()}
      </Box>

      {/* Key Findings */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom className={classes.sectionTitle}>
          {"주요 발견사항"}
        </Typography>
        {key_findings?.map((finding, index) => (
          <Card key={index} variant="outlined" className={classes.card}>
            <CardContent>
              <Typography variant="h6" className={classes.cardTitle}>
                {finding.finding}
              </Typography>
              <Typography variant="body1" className={classes.bodyText}>
                {finding.impact}
              </Typography>
              <Typography variant="body1" className={classes.bodyText}>
                {finding.recommendation}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recommendations */}
      <Box my={4}>
        <Typography variant="h5" gutterBottom className={classes.sectionTitle}>
          {"권장사항"}
        </Typography>
        {recommendations?.immediate_actions && (
          <>
            <Typography variant="h6" gutterBottom className={classes.sectionTitle}>
              {"즉각적인 조치"}
            </Typography>
            <ul>
              {recommendations.immediate_actions.map((action, index) => (
                <li key={index} className={classes.listItem}>
                  <Typography variant="body1">{action}</Typography>
                </li>
              ))}
            </ul>
          </>
        )}
        {recommendations?.further_analysis && (
          <>
            <Typography variant="h6" gutterBottom className={classes.sectionTitle}>
              {"추가 분석"}
            </Typography>
            <ul>
              {recommendations.further_analysis.map((analysis, index) => (
                <li key={index} className={classes.listItem}>
                  <Typography variant="body1">{analysis}</Typography>
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
NeuralNetworkVisualization.propTypes = {
  result: PropTypes.shape({
    graph1: PropTypes.shape({
      graph_type: PropTypes.string,
      loss: PropTypes.arrayOf(PropTypes.number).isRequired,
      val_loss: PropTypes.arrayOf(PropTypes.number).isRequired,
      epochs: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
    graph2: PropTypes.shape({
      graph_type: PropTypes.string,
      y_test: PropTypes.arrayOf(PropTypes.number).isRequired,
      y_pred: PropTypes.arrayOf(PropTypes.number).isRequired,
      identifiers: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ).isRequired,
    }).isRequired,
    graph3: PropTypes.shape({
      graph_type: PropTypes.string,
      mse: PropTypes.number.isRequired,
      mae: PropTypes.number.isRequired,
      r2_score: PropTypes.number.isRequired,
    }).isRequired,
    model: PropTypes.string,
    architecture: PropTypes.string,
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
    model_performance: PropTypes.shape({
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          metric_name: PropTypes.string.isRequired,
          metric_value: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string,
          ]).isRequired,
          interpretation: PropTypes.string.isRequired,
        })
      ).isRequired,
      prediction_analysis: PropTypes.shape({
        overall_accuracy: PropTypes.string,
        notable_patterns: PropTypes.arrayOf(PropTypes.string),
      }),
    }).isRequired,
    feature_importance: PropTypes.shape({
      key_features: PropTypes.arrayOf(
        PropTypes.shape({
          feature_name: PropTypes.string.isRequired,
          importance_score: PropTypes.number, // can be null
          business_impact: PropTypes.string.isRequired,
        })
      ),
      relationships: PropTypes.arrayOf(
        PropTypes.shape({
          description: PropTypes.string.isRequired,
          business_insight: PropTypes.string.isRequired,
        })
      ),
    }),
    visualizations: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        type: PropTypes.string,
        description: PropTypes.string,
        insights: PropTypes.string,
      })
    ).isRequired,
    key_findings: PropTypes.arrayOf(
      PropTypes.shape({
        finding: PropTypes.string.isRequired,
        impact: PropTypes.string.isRequired,
        recommendation: PropTypes.string.isRequired,
      })
    ),
    recommendations: PropTypes.shape({
      immediate_actions: PropTypes.arrayOf(PropTypes.string),
      further_analysis: PropTypes.arrayOf(PropTypes.string),
    }),
    Neural_Network: PropTypes.shape({
      report_title: PropTypes.string,
      Predictions_vs_Actual: PropTypes.shape({
        Predictions_vs_Actual_title: PropTypes.string,
        "x-axis_title": PropTypes.string,
        "x-axis_description": PropTypes.string,
        "y-axis_title": PropTypes.string,
        "y-axis_description": PropTypes.string,
      }),
    }).isRequired,
  }).isRequired,
};

export default NeuralNetworkVisualization;
