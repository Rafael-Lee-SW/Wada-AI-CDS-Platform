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

function RandomForestRegressorVisualization({ result, explanation }) {
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
      console.error(
        "Invalid feature importances data:",
        featureImportances,
        featureNames
      );
      return null;
    }

    let df_importances = featureNames.map((feature, index) => ({
      Feature: feature,
      Importance: featureImportances[index],
    }));

    // Sort descending for better visualization
    df_importances.sort((a, b) => b.Importance - a.Importance);

    // Show top 6 features
    df_importances = df_importances.slice(0, 6);

    return (
      <Plot
        data={[
          {
            type: "bar",
            y: df_importances.map((item) => item.Importance),
            x: df_importances.map((item) => item.Feature),
            orientation: "v",
            marker: {
              color: "rgba(55,128,191,0.7)",
              width: 1,
            },
          },
        ]}
        layout={{
          title: visualizations[0]?.title || "Feature Importances",
          xaxis: {
            title: "Feature",
            automargin: true,
          },
          yaxis: {
            title: "Importance",
            automargin: true,
          },
          margin: { l: 50, r: 50, t: 50, b: 100 },
          height: 600,
          template: "plotly_white",
        }}
        config={{ responsive: true }}
      />
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

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.Metric}</TableCell>
                <TableCell>{row.Value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
      <Plot
        data={[
          {
            type: "scatter",
            mode: "markers",
            x: df_residual.map((item) => item.Identifier),
            y: df_residual.map((item) => item.Residual),
            text: df_residual.map(
              (item) =>
                `ID: ${item.Identifier}<br>Residual: ${item.Residual.toFixed(
                  2
                )}`
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

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identifier</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Predicted</TableHead>
              <TableHead>Residual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data_table.map((row) => (
              <TableRow
                key={row.id}
                className={
                  row.Residual > 1.0
                    ? "bg-red-100"
                    : row.Residual < -1.0
                    ? "bg-blue-100"
                    : ""
                }
              >
                <TableCell>{row.Identifier}</TableCell>
                <TableCell>{row.Actual}</TableCell>
                <TableCell>{row.Predicted}</TableCell>
                <TableCell>{row.Residual}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Final Return
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Report Title */}
      <h1 className="text-4xl font-bold text-center mb-8">
        {report_title || "Regression Model Analysis Report"}
      </h1>

      {/* Overview */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <p>{overview.analysis_purpose}</p>
        <p>{overview.data_description}</p>
        <p>{overview.models_used?.model_description}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feature_importance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="feature_importance">Feature Importances</TabsTrigger>
          <TabsTrigger value="regression_metrics">Regression Metrics</TabsTrigger>
          <TabsTrigger value="actual_vs_predicted">Actual vs Predicted</TabsTrigger>
          <TabsTrigger value="residuals">Residuals</TabsTrigger>
          <TabsTrigger value="predictions_overview">Predictions</TabsTrigger>
        </TabsList>

        {/* Feature Importances Tab */}
        <TabsContent value="feature_importance">
          <Card>
            <CardHeader>
              <CardTitle>{visualizations[0]?.title || "Feature Importances"}</CardTitle>
              <CardDescription>
                {visualizations[0]?.description || "Importance of each feature in the model"}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderFeatureImportances()}</CardContent>
          </Card>
        </TabsContent>

        {/* Regression Metrics Tab */}
        <TabsContent value="regression_metrics">
          <Card>
            <CardHeader>
              <CardTitle>Regression Metrics</CardTitle>
            </CardHeader>
            <CardContent>{renderRegressionMetrics()}</CardContent>
          </Card>
        </TabsContent>

        {/* Actual vs Predicted Tab */}
        <TabsContent value="actual_vs_predicted">
          <Card>
            <CardHeader>
              <CardTitle>{visualizations[1]?.title || "Actual vs Predicted"}</CardTitle>
            </CardHeader>
            <CardContent>{renderActualVsPredictedScatter()}</CardContent>
          </Card>
        </TabsContent>

        {/* Residuals Tab */}
        <TabsContent value="residuals">
          <Card>
            <CardHeader>
              <CardTitle>Residuals of Predictions</CardTitle>
            </CardHeader>
            <CardContent>{renderResidualsPlot()}</CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Overview Tab */}
        <TabsContent value="predictions_overview">
          <Card>
            <CardHeader>
              <CardTitle>Predictions Overview</CardTitle>
            </CardHeader>
            <CardContent>{renderPredictionsTable()}</CardContent>
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
              {key_findings.map((finding, index) => (
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
            {recommendations.immediate_actions && recommendations.immediate_actions.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-2">Immediate Actions</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {recommendations.immediate_actions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </>
            )}
            {recommendations.further_analysis && recommendations.further_analysis.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-2">Further Analysis</h3>
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
RandomForestRegressorVisualization.propTypes = {
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

export default RandomForestRegressorVisualization;
