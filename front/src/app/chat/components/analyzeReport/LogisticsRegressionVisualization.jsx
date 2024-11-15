"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { PCA } from "ml-pca";

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
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Eye, EyeOff } from "lucide-react";
import { Typography } from "@mui/material";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function LogisticRegressionVisualization({ result, explanation }) {
  // State variables
  const [decisionBoundaryData, setDecisionBoundaryData] = useState(null);
  const [classificationReportData, setClassificationReportData] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [confusionMatrixData, setConfusionMatrixData] = useState(null);
  const [boundaryLinesTitles, setBoundaryLinesTitles] = useState([]);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState("decision_boundary");

  // Extract relevant sections from explanation prop
  const {
    overview,
    model_performance,
    feature_importance,
    visualizations,
    key_findings,
    recommendations,
    LogisticRegression_Case,
  } = explanation || {};

  // Extract report titles and descriptions
  const reportTitle =
    LogisticRegression_Case?.report_title || "AI Model Analysis Report";
  const classesInfo = LogisticRegression_Case?.classes || {};
  const boundaryLines = LogisticRegression_Case?.boundary_lines || {};
  const xAxisTitle = explanation["x-axis_title"] || "PC1";
  const xAxisDescription =
    explanation["x-axis_description"] ||
    "PC1 is the first principal component influencing employee performance.";
  const yAxisTitle = explanation["y-axis_title"] || "PC2";
  const yAxisDescription =
    explanation["y-axis_description"] ||
    "PC2 is the second principal component detailing aspects of performance.";

  // Process the result prop to extract necessary data
  useEffect(() => {
    try {
      if (!result) {
        setError("No result data available.");
        return;
      }

      const { graph1, graph3, graph4 } = result;

      // --- Decision Boundary Plot ---
      if (graph1 && graph1.graph_type === "decision_boundary") {
        const { X_pca, y, coefficients, intercept, classes } = graph1;

        if (
          !X_pca ||
          !y ||
          !coefficients ||
          !intercept ||
          !classes ||
          X_pca.length === 0 ||
          y.length === 0
        ) {
          setError("Incomplete data for Decision Boundary Plot.");
        } else {
          const figure = createDecisionBoundaryPlot(
            X_pca,
            y,
            coefficients,
            intercept,
            classes,
            boundaryLines
          );
          setDecisionBoundaryData(figure);
        }
      } else {
        setError("No Decision Boundary data available.");
      }

      // --- Classification Report ---
      if (graph3 && graph3.classification_report) {
        const report = graph3.classification_report;
        const { reportRows, overallAccuracy } = transformClassificationReport(
          report
        );
        setClassificationReportData(reportRows);
        setAccuracy(overallAccuracy);
      } else {
        setError("No Classification Report data available.");
      }

      // --- Confusion Matrix ---
      if (graph4 && graph4.confusion_matrix && graph4.labels) {
        const { confusion_matrix, labels } = graph4;
        const figure = createConfusionMatrixPlot(confusion_matrix, labels);
        setConfusionMatrixData(figure);
      } else {
        setError("No Confusion Matrix data available.");
      }

      // --- Boundary Lines Titles ---
      if (
        boundaryLines.boundary_line_title &&
        boundaryLines.boundary_line_title.length > 0
      ) {
        setBoundaryLinesTitles(boundaryLines.boundary_line_title);
      }

      // Clear any previous errors if data is processed successfully
      setError(null);
    } catch (e) {
      console.error("Error processing visualization data:", e);
      setError("Failed to process visualization data.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Helper function to create Decision Boundary Plot
  const createDecisionBoundaryPlot = (
    X_pca,
    y,
    coefficients,
    intercept,
    classes,
    boundaryLines
  ) => {
    const fig = {
      data: [],
      layout: {
        title: visualizations[0]?.title || "Decision Boundary",
        xaxis: {
          title: xAxisTitle || "PC1",
          zeroline: false,
          showgrid: true,
          gridcolor: "#e5e5e5",
        },
        yaxis: {
          title: yAxisTitle || "PC2",
          zeroline: false,
          showgrid: true,
          gridcolor: "#e5e5e5",
        },
        legend: {
          title: { text: "Classes" },
          orientation: "h",
          x: 0,
          y: -0.2,
        },
        plot_bgcolor: "#f9f9f9",
        paper_bgcolor: "#f9f9f9",
        height: 600,
        margin: { t: 50, l: 50, r: 50, b: 100 },
        font: { family: "Arial, sans-serif", color: "#1D1D1F" },
        hovermode: "closest",
        annotations: [], // To hold boundary line titles
      },
    };

    // Add scatter plot for data points
    fig.data.push({
      x: X_pca.map((point) => point[0]),
      y: X_pca.map((point) => point[1]),
      mode: "markers",
      type: "scatter",
      marker: {
        color: y,
        colorscale: "RdBu",
        showscale: false,
        line: { width: 1, color: "black" },
      },
      name: "Data Points",
      hoverinfo: "text",
      text: y.map(
        (label, idx) =>
          `Class: ${label}<br>PC1: ${X_pca[idx][0].toFixed(
            2
          )}<br>PC2: ${X_pca[idx][1].toFixed(2)}`
      ),
    });

    // Compute and plot decision boundaries
    const xMin = d3.min(X_pca, (d) => d[0]) - 1;
    const xMax = d3.max(X_pca, (d) => d[0]) + 1;
    const xVals = d3.range(xMin, xMax, (xMax - xMin) / 200);

    const annotations = [];

    if (classes.length === 2) {
      // Binary classification
      const w = coefficients[0]; // Assuming binary classification uses first set of coefficients
      const b = intercept[0];
      if (w[1] !== 0) {
        const yVals = xVals.map((x) => (-b - w[0] * x) / w[1]);
        fig.data.push({
          x: xVals,
          y: yVals,
          mode: "lines",
          line: { color: "black", width: 2 },
          name: "Decision Boundary",
        });
        // Add annotation for the boundary line
        annotations.push({
          x: (xMin + xMax) / 2,
          y: (-b - w[0] * ((xMin + xMax) / 2)) / w[1],
          xref: "x",
          yref: "y",
          text: "Decision Boundary",
          showarrow: false,
          font: { color: "black", size: 12 },
        });
      }
    } else {
      // Multiclass classification
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          const w_diff = [
            coefficients[i][0] - coefficients[j][0],
            coefficients[i][1] - coefficients[j][1],
          ];
          const b_diff = intercept[i] - intercept[j];
          if (w_diff[1] !== 0) {
            const yVals = xVals.map((x) => (-b_diff - w_diff[0] * x) / w_diff[1]);
            fig.data.push({
              x: xVals,
              y: yVals,
              mode: "lines",
              line: { color: "gray", width: 2, dash: "dash" },
              name: `Boundary ${classes[i]} vs ${classes[j]}`,
            });

            // Calculate midpoint for annotation
            const midX = (xMin + xMax) / 2;
            const midY = (-b_diff - w_diff[0] * midX) / w_diff[1];

            // Retrieve the corresponding boundary line title
            const boundaryTitle =
              boundaryLines.boundary_line_title?.[
                (i * classes.length + j) - (i + 1) * (i / 2)
              ] || `Boundary ${classes[i]} vs ${classes[j]}`;

            // Add annotation for the boundary line
            annotations.push({
              x: midX,
              y: midY,
              xref: "x",
              yref: "y",
              text: boundaryTitle,
              showarrow: false,
              font: { color: "gray", size: 12 },
            });
          }
        }
      }
    }

    fig.layout.annotations = annotations;

    return fig;
  };

  // Helper function to transform Classification Report into DataFrame-like structure
  const transformClassificationReport = (report) => {
    const rows = [];
    let overallAccuracy = null;

    Object.keys(report).forEach((key) => {
      if (key === "accuracy") {
        overallAccuracy = report[key];
      } else if (["macro avg", "weighted avg"].includes(key)) {
        if (
          typeof report[key] === "object" &&
          report[key].precision !== undefined
        ) {
          rows.push({
            Class: key,
            Precision: report[key].precision.toFixed(2),
            Recall: report[key].recall.toFixed(2),
            "F1-Score": report[key]["f1-score"].toFixed(2),
            Support: report[key].support,
          });
        } else {
          // Handle unexpected format
          rows.push({
            Class: key,
            Precision: "N/A",
            Recall: "N/A",
            "F1-Score": "N/A",
            Support: "N/A",
          });
        }
      } else {
        if (
          typeof report[key] === "object" &&
          report[key].precision !== undefined
        ) {
          rows.push({
            Class: key,
            Precision: report[key].precision.toFixed(2),
            Recall: report[key].recall.toFixed(2),
            "F1-Score": report[key]["f1-score"].toFixed(2),
            Support: report[key].support,
          });
        } else {
          // Handle unexpected format
          rows.push({
            Class: key,
            Precision: "N/A",
            Recall: "N/A",
            "F1-Score": "N/A",
            Support: "N/A",
          });
        }
      }
    });

    return { reportRows: rows, overallAccuracy };
  };

  // Helper function to create Confusion Matrix Plot
  const createConfusionMatrixPlot = (confusionMatrix, labels) => {
    const fig = {
      data: [
        {
          z: confusionMatrix,
          x: labels,
          y: labels,
          type: "heatmap",
          colorscale: "Blues",
          showscale: true,
          hoverongaps: false,
          text: confusionMatrix.map((row) => row.join(", ")),
          hovertemplate:
            "True: %{y}<br>Predicted: %{x}<br>Count: %{z}<extra></extra>",
        },
      ],
      layout: {
        title: visualizations[1]?.title || "Confusion Matrix",
        xaxis: { title: "Predicted Label", zeroline: false },
        yaxis: { title: "True Label", zeroline: false },
        plot_bgcolor: "#f9f9f9",
        paper_bgcolor: "#f9f9f9",
        height: 600,
        margin: { t: 50, l: 50, r: 50, b: 100 },
        font: { family: "Arial, sans-serif", color: "#1D1D1F" },
      },
    };
    return fig;
  };

  // Render Classification Report as a table
  const renderClassificationReport = () => {
    if (!classificationReportData) return null;

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
            {classificationReportData.map((row, index) => (
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
      </div>
    );
  };

  // Handle tab change
  const handleTabChange = (value) => {
    setTabValue(value);
  };

  // Render the component
  return (
    <div className="container mx-auto p-4 space-y-8">
      {error && (
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
      )}
      {!error && (
        <>
          {/* Report Title */}
          <h1 className="text-4xl font-bold text-center mb-8">{reportTitle}</h1>

          {/* Tabs */}
          <Tabs value={tabValue} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="decision_boundary">
                Decision Boundary
              </TabsTrigger>
              <TabsTrigger value="classification_report">
                Classification Report
              </TabsTrigger>
              <TabsTrigger value="confusion_matrix">
                Confusion Matrix
              </TabsTrigger>
            </TabsList>

            {/* Decision Boundary Tab */}
            <TabsContent value="decision_boundary">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[0]?.title || "Decision Boundary"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[0]?.description ||
                      "Visualization of decision boundaries in 2D space"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {decisionBoundaryData && (
                    <Plot
                      data={decisionBoundaryData.data}
                      layout={decisionBoundaryData.layout}
                      config={{ responsive: true }}
                    />
                  )}
                  {/* Axis Descriptions */}
                  {xAxisDescription && (
                    <p className="text-sm text-gray-600 mt-2">{xAxisDescription}</p>
                  )}
                  {yAxisDescription && (
                    <p className="text-sm text-gray-600 mt-2">{yAxisDescription}</p>
                  )}
                  {/* Class Descriptions and Boundary Lines Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Class Descriptions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Class Descriptions
                      </h3>
                      {classesInfo.classTitle &&
                        classesInfo.classDescription &&
                        classesInfo.classTitle.map((title, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle>{title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{classesInfo.classDescription[index]}</p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                    {/* Boundary Lines Descriptions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Decision Boundary Descriptions
                      </h3>
                      {boundaryLines.boundary_line_description &&
                        boundaryLines.boundary_line_description.map((desc, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle>
                                {boundaryLines.boundary_line_title[index] ||
                                  `Boundary ${index + 1}`}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{desc}</p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Classification Report Tab */}
            <TabsContent value="classification_report">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[0]?.description || "Classification Report"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Display Overall Accuracy */}
                  {accuracy !== null && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        Overall Accuracy: {accuracy.toFixed(4)}
                      </h3>
                    </div>
                  )}
                  {/* Render Classification Report Table */}
                  {renderClassificationReport()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Confusion Matrix Tab */}
            <TabsContent value="confusion_matrix">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[1]?.title || "Confusion Matrix"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[1]?.description ||
                      "Visualization of the confusion matrix"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {confusionMatrixData && (
                    <Plot
                      data={confusionMatrixData.data}
                      layout={confusionMatrixData.layout}
                      config={{ responsive: true }}
                    />
                  )}
                  {/* Insights for Confusion Matrix */}
                  {visualizations[1]?.insights && (
                    <p className="text-sm text-gray-600 mt-2">
                      {visualizations[1].insights}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Feature Importance */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
              {feature_importance?.key_features_title || "Feature Importance"}
            </h2>
            {feature_importance?.key_features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{feature.feature_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{feature.business_impact}</p>
                </CardContent>
              </Card>
            ))}
            {feature_importance?.relationships.map((rel, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Relationship {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{rel.description}</p>
                  <p>{rel.business_insight}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Key Findings */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
              {explanation.key_findings_section_title || "Key Findings"}
            </h2>
            {key_findings.map((finding, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{finding.finding}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>{finding.impact_label || "Impact"}:</strong>{" "}
                    {finding.impact}
                  </p>
                  <p>
                    <strong>
                      {finding.recommendation_label || "Recommendation"}:
                    </strong>{" "}
                    {finding.recommendation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recommendations */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
              {explanation.recommendations_section_title || "Recommendations"}
            </h2>
            {recommendations.immediate_actions &&
              recommendations.immediate_actions.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    {recommendations.immediate_actions_title ||
                      "Immediate Actions"}
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.immediate_actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </>
              )}
            {recommendations.further_analysis &&
              recommendations.further_analysis.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    {recommendations.further_analysis_title ||
                      "Further Analysis"}
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.further_analysis.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </>
              )}
          </div>
        </>
      )}
    </div>
  );
}

// Define PropTypes for type checking
LogisticRegressionVisualization.propTypes = {
  result: PropTypes.shape({
    cluster_label: PropTypes.string,
    graph1: PropTypes.shape({
      graph_type: PropTypes.string,
      X_pca: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
      y: PropTypes.arrayOf(PropTypes.number),
      coefficients: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
      intercept: PropTypes.arrayOf(PropTypes.number),
      classes: PropTypes.arrayOf(PropTypes.number),
    }),
    graph3: PropTypes.shape({
      graph_type: PropTypes.string,
      classification_report: PropTypes.object,
    }),
    graph4: PropTypes.shape({
      graph_type: PropTypes.string,
      confusion_matrix: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
      labels: PropTypes.arrayOf(PropTypes.string),
    }),
    model: PropTypes.string,
  }).isRequired,
  explanation: PropTypes.shape({
    overview: PropTypes.shape({
      analysis_purpose: PropTypes.string,
      data_description: PropTypes.string,
      models_used: PropTypes.shape({
        model_description: PropTypes.string,
      }),
    }),
    model_performance: PropTypes.shape({
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          metric_name: PropTypes.string,
          metric_value: PropTypes.number,
          interpretation: PropTypes.string,
        })
      ),
      prediction_analysis: PropTypes.shape({
        overall_accuracy: PropTypes.string,
        notable_patterns: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
    feature_importance: PropTypes.shape({
      key_features: PropTypes.arrayOf(
        PropTypes.shape({
          feature_name: PropTypes.string,
          importance_score: PropTypes.number,
          business_impact: PropTypes.string,
        })
      ),
      relationships: PropTypes.arrayOf(
        PropTypes.shape({
          description: PropTypes.string,
          business_insight: PropTypes.string,
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
    ),
    key_findings: PropTypes.arrayOf(
      PropTypes.shape({
        finding: PropTypes.string,
        impact_label: PropTypes.string,
        impact: PropTypes.string,
        recommendation_label: PropTypes.string,
        recommendation: PropTypes.string,
      })
    ),
    recommendations: PropTypes.shape({
      immediate_actions: PropTypes.arrayOf(PropTypes.string),
      immediate_actions_title: PropTypes.string,
      further_analysis: PropTypes.arrayOf(PropTypes.string),
      further_analysis_title: PropTypes.string,
    }),
    LogisticRegression_Case: PropTypes.shape({
      report_title: PropTypes.string,
      classes: PropTypes.shape({
        classTitle: PropTypes.arrayOf(PropTypes.string),
        classDescription: PropTypes.arrayOf(PropTypes.string),
      }),
      boundary_lines: PropTypes.shape({
        boundary_line_title: PropTypes.arrayOf(PropTypes.string),
        boundary_line_description: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
    "x-axis_title": PropTypes.string,
    "x-axis_description": PropTypes.string,
    "y-axis_title": PropTypes.string,
    "y-axis_description": PropTypes.string,
    overview_section_title: PropTypes.string,
    key_findings_section_title: PropTypes.string,
    recommendations_section_title: PropTypes.string,
    data_table_title: PropTypes.string,
  }).isRequired,
};

export default LogisticRegressionVisualization;
