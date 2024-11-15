"use client";

import React from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

// Import custom UI components from your template
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function NeuralNetworkVisualization({ result, explanation }) {
  // Destructure data from result and explanation
  const { graph1, graph2, graph3, model, architecture } = result || {};

  const {
    overview = {},
    model_performance = {},
    visualizations = [],
    key_findings = [],
    recommendations = {},
    Neural_Network = {},
  } = explanation || {};

  // --- Visualization functions ---

  // Render the loss curve plot
  const renderLossCurve = () => {
    // Check if graph1 and its properties are available
    if (!graph1 || !graph1.loss || !graph1.val_loss || !graph1.epochs) {
      return (
        <p className="text-red-500">
          Cannot render loss curve. Data is missing.
        </p>
      );
    }

    // Convert to numbers if they are strings
    const lossData = graph1.loss.map((value) => Number(value));
    const valLossData = graph1.val_loss.map((value) => Number(value));
    const epochsData = graph1.epochs.map((value) => Number(value));

    // Check for NaN values
    if (
      lossData.some(isNaN) ||
      valLossData.some(isNaN) ||
      epochsData.some(isNaN)
    ) {
      return (
        <p className="text-red-500">
          Cannot render loss curve. Data contains non-numeric values.
        </p>
      );
    }

    return (
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
          title: visualizations?.[0]?.title || "Loss Curve",
          xaxis: {
            title: "Epochs",
          },
          yaxis: {
            title: "Loss Value",
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
    );
  };

  // Render the predictions vs actual scatter plot
  const renderPredictionScatter = () => {
    if (!graph2) return null;

    const { y_test, y_pred, identifiers } = graph2;

    // Check if y_test and y_pred are present
    if (!y_test || !y_pred) {
      return (
        <p className="text-red-500">
          Prediction data is not available.
        </p>
      );
    }

    // Convert to numbers if they are strings
    const yTestData = y_test.map((value) => Number(value));
    const yPredData = y_pred.map((value) => Number(value));

    // Check for NaN values
    if (yTestData.some(isNaN) || yPredData.some(isNaN)) {
      return (
        <p className="text-red-500">
          Cannot render prediction graph. Data contains non-numeric values.
        </p>
      );
    }

    return (
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
            "Predicted vs Actual Values",
          xaxis: {
            title:
              Neural_Network?.Predictions_vs_Actual?.["x-axis_title"] ||
              "Actual Values",
          },
          yaxis: {
            title:
              Neural_Network?.Predictions_vs_Actual?.["y-axis_title"] ||
              "Predicted Values",
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
    );
  };

  // Render the metrics table
  const renderMetricsTable = () => {
    if (!model_performance?.metrics) return null;

    const metrics = model_performance.metrics.map((metric, index) => ({
      id: index,
      metric_name: metric.metric_name,
      metric_value: metric.metric_value,
      interpretation: metric.interpretation,
    }));

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Interpretation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.metric_name}</TableCell>
                <TableCell>
                  {isNaN(Number(row.metric_value))
                    ? "No Data"
                    : Number(row.metric_value).toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                </TableCell>
                <TableCell>{row.interpretation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // --- Final return ---
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Report Title */}
      <h1 className="text-4xl font-bold text-center mb-8">
        {Neural_Network?.report_title ||
          "Neural Network Regressor Analysis Report"}
      </h1>

      {/* Overview */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <p>{overview?.analysis_purpose}</p>
        <p>{overview?.data_description}</p>
        <p>{overview?.models_used?.model_description}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="loss_curve" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="loss_curve">
            {visualizations?.[0]?.title || "Loss Curve"}
          </TabsTrigger>
          <TabsTrigger value="predictions">
            {Neural_Network?.Predictions_vs_Actual
              ?.Predictions_vs_Actual_title || "Predictions vs Actual"}
          </TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        {/* Loss Curve Tab */}
        <TabsContent value="loss_curve">
          <Card>
            <CardHeader>
              <CardTitle>
                {visualizations?.[0]?.title || "Loss Curve"}
              </CardTitle>
              <CardDescription>
                {visualizations?.[0]?.description ||
                  "Training and validation loss over epochs."}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderLossCurve()}</CardContent>
          </Card>
        </TabsContent>

        {/* Predictions vs Actual Tab */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>
                {Neural_Network?.Predictions_vs_Actual
                  ?.Predictions_vs_Actual_title ||
                  "Predicted vs Actual Values"}
              </CardTitle>
              <CardDescription>
                {visualizations?.[1]?.description ||
                  "Scatter plot comparing predicted values to actual values."}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderPredictionScatter()}</CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>{renderMetricsTable()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Key Findings and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle>Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {key_findings?.map((finding, index) => (
                <li key={index}>
                  <strong>{finding.finding}</strong>: {finding.impact}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations?.immediate_actions &&
              recommendations.immediate_actions.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    Immediate Actions
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.immediate_actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </>
              )}
            {recommendations?.further_analysis &&
              recommendations.further_analysis.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    Further Analysis
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.further_analysis.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
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
