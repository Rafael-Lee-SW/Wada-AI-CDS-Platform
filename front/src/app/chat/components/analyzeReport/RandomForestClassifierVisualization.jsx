"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

// Import custom UI components from your template
import { Slider } from "../ui/silder";
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

function RandomForestClassifierVisualization({ result, explanation }) {
  // State for threshold slider
  const [threshold, setThreshold] = useState(0.5);

  // Handle threshold slider change
  const handleThresholdChange = (value) => {
    setThreshold(value[0]);
  };

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

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Precision</TableHead>
              <TableHead>Recall</TableHead>
              <TableHead>F1-Score</TableHead>
              <TableHead>Support</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.Class}</TableCell>
                <TableCell>{row.Precision}</TableCell>
                <TableCell>{row.Recall}</TableCell>
                <TableCell>{row["F1-Score"]}</TableCell>
                <TableCell>{row.Support}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-4">
          <strong>Accuracy:</strong> {result.accuracy.toFixed(3)}
        </p>
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
      <div>
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
        <div className="mt-4">
          <label htmlFor="threshold-slider" className="block text-sm font-medium mb-2">
            Set Classification Threshold: {threshold}
          </label>
          <Slider
            id="threshold-slider"
            min={0}
            max={1}
            step={0.01}
            value={[threshold]}
            onValueChange={handleThresholdChange}
            className="w-full"
          />
        </div>
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

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identifier</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Predicted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data_table.map((row) => (
              <TableRow
                key={row.id}
                className={
                  row.Predicted === 1 ? "bg-red-100" : "bg-blue-100"
                }
              >
                <TableCell>{row.Identifier}</TableCell>
                <TableCell>{row.Actual}</TableCell>
                <TableCell>{row.Predicted}</TableCell>
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
        {report_title || "Classification Model Analysis Report"}
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
          <TabsTrigger value="classification_metrics">Classification Metrics</TabsTrigger>
          <TabsTrigger value="confusion_matrix">Confusion Matrix</TabsTrigger>
          <TabsTrigger value="classification_probabilities">Probabilities</TabsTrigger>
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

        {/* Classification Metrics Tab */}
        <TabsContent value="classification_metrics">
          <Card>
            <CardHeader>
              <CardTitle>Classification Metrics</CardTitle>
            </CardHeader>
            <CardContent>{renderClassificationMetrics()}</CardContent>
          </Card>
        </TabsContent>

        {/* Confusion Matrix Tab */}
        <TabsContent value="confusion_matrix">
          <Card>
            <CardHeader>
              <CardTitle>Confusion Matrix</CardTitle>
            </CardHeader>
            <CardContent>{renderConfusionMatrix()}</CardContent>
          </Card>
        </TabsContent>

        {/* Classification Probabilities Tab */}
        <TabsContent value="classification_probabilities">
          <Card>
            <CardHeader>
              <CardTitle>Classification Probabilities</CardTitle>
            </CardHeader>
            <CardContent>{renderClassificationProbabilities()}</CardContent>
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
RandomForestClassifierVisualization.propTypes = {
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
      y_proba: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
      identifier: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
    graph3: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      classification_report: PropTypes.object.isRequired,
    }).isRequired,
    graph4: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      confusion_matrix: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
        .isRequired,
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

export default RandomForestClassifierVisualization;
