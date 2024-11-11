// src/app/chat/components/analyzeReport/LogisticRegressionVisualization.js

import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import {
  Typography,
  Card,
  CardContent,
  Box,
  Container,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import * as d3 from "d3"; // For color scales
import useAnalyzingLogisticStyles from "/styles/analyzingLogisticStyle.js"; // Custom styles
import PropTypes from "prop-types";

// The LogisticRegressionVisualization component visualizes Logistic Regression results,
// including Decision Boundary, Classification Report, and Confusion Matrix.
function LogisticRegressionVisualization({ result, explanation }) {
  const classes = useAnalyzingLogisticStyles();

  // State variables
  const [decisionBoundaryData, setDecisionBoundaryData] = useState(null);
  const [classificationReportData, setClassificationReportData] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [confusionMatrixData, setConfusionMatrixData] = useState(null);
  const [boundaryLinesTitles, setBoundaryLinesTitles] = useState([]);
  const [error, setError] = useState(null);

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
  console.log(LogisticRegression_Case.report_title)
  const reportTitle =
  LogisticRegression_Case?.report_title || "AI 모델 분석 보고서";
  const classesInfo = LogisticRegression_Case?.classes || {};
  const boundaryLines = LogisticRegression_Case?.boundary_lines || {};
  const xAxisTitle =
    explanation["x-axis_title"] || "PC1: 성과를 예측하는 첫 번째 주요 특성";
  const xAxisDescription =
    explanation["x-axis_description"] ||
    "PC1은 직원의 성과에 중요한 영향을 미치는 첫 번째 요인입니다.";
  const yAxisTitle =
    explanation["y-axis_title"] || "PC2: 성과를 예측하는 두 번째 주요 특성";
  const yAxisDescription =
    explanation["y-axis_description"] ||
    "PC2는 직원 성과의 세부적인 부분을 설명하는 특성입니다.";

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
        title: "Decision Boundary",
        xaxis: { title: "PC1", zeroline: false, showgrid: true, gridcolor: "#e5e5e5" },
        yaxis: { title: "PC2", zeroline: false, showgrid: true, gridcolor: "#e5e5e5" },
        legend: { title: { text: "Classes" }, orientation: "h", x: 0, y: -0.2 },
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
            const boundaryIndex = (i * classes.length + j) - (i + 1) * (i / 2);
            const boundaryTitle = boundaryLines.boundary_line_title
              ? boundaryLines.boundary_line_title[
                  classes.length === 4 ? (i * (classes.length - 1)) + j - 1 : 0
                ]
              : `Boundary ${classes[i]} vs ${classes[j]}`;

            // Add annotation for the boundary line
            annotations.push({
              x: midX,
              y: midY,
              xref: "x",
              yref: "y",
              text: boundaryTitle || `Boundary ${classes[i]} vs ${classes[j]}`,
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
        if (typeof report[key] === "object" && report[key].precision !== undefined) {
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
        if (typeof report[key] === "object" && report[key].precision !== undefined) {
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
        title: "Confusion Matrix",
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

  // Render Classification Report as a DataGrid table
  const renderClassificationReport = () => {
    if (!classificationReportData) return null;

    const columns = [
      { field: "Class", headerName: "Class", flex: 1, minWidth: 150 },
      { field: "Precision", headerName: "Precision", flex: 1, minWidth: 150 },
      { field: "Recall", headerName: "Recall", flex: 1, minWidth: 150 },
      { field: "F1-Score", headerName: "F1-Score", flex: 1, minWidth: 150 },
      { field: "Support", headerName: "Support", flex: 1, minWidth: 150 },
    ];

    const rows = classificationReportData.map((row, index) => ({
      id: index,
      ...row,
    }));

    return (
      <div style={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20, 50, 100]}
          disableSelectionOnClick
          className={classes.dataGrid}
        />
      </div>
    );
  };

  // Render the component
  return (
    <Container maxWidth="lg" className={classes.container}>
      {error && (
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
      )}
      {!error && (
        <>
          {/* Report Title */}
          <Box my={4}>
            <Typography
              variant="h3"
              align="center"
              gutterBottom
              className={classes.reportTitle}
            >
              {reportTitle}
            </Typography>
          </Box>

          {/* Analysis Overview */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {explanation.overview_section_title || "분석 개요"}
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              className={classes.bodyText}
            >
              {overview?.analysis_purpose}
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              className={classes.bodyText}
            >
              {overview?.data_description}
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              className={classes.bodyText}
            >
              {overview?.models_used?.model_description}
            </Typography>
          </Box>

          {/* Decision Boundary Plot */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {visualizations[0]?.title || "결정 경계 시각화"}
            </Typography>
            {decisionBoundaryData && (
              <Plot
                data={decisionBoundaryData.data}
                layout={decisionBoundaryData.layout}
                config={{ responsive: true }}
              />
            )}
            {/* Axis Descriptions */}
            {xAxisDescription && (
              <Typography
                variant="body2"
                gutterBottom
                className={classes.typographyBody2}
              >
                {xAxisDescription}
              </Typography>
            )}
            {yAxisDescription && (
              <Typography
                variant="body2"
                gutterBottom
                className={classes.typographyBody2}
              >
                {yAxisDescription}
              </Typography>
            )}

            {/* Class Descriptions and Boundary Lines Descriptions */}
            <Box my={4}>
              <Grid container spacing={4}>
                {/* Class Descriptions */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" className={classes.cardTitle}>
                    클래스 설명
                  </Typography>
                  {classesInfo.classTitle &&
                    classesInfo.classDescription &&
                    classesInfo.classTitle.map((title, index) => (
                      <Card key={index} variant="outlined" className={classes.card}>
                        <CardContent>
                          <Typography variant="subtitle1" className={classes.cardSubtitle}>
                            {title}
                          </Typography>
                          <Typography variant="body2" className={classes.bodyText}>
                            {classesInfo.classDescription[index]}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
                {/* Boundary Lines Descriptions */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" className={classes.cardTitle}>
                    결정 경계 설명
                  </Typography>
                  {boundaryLines.boundary_line_description &&
                    boundaryLines.boundary_line_description.map((desc, index) => (
                      <Card key={index} variant="outlined" className={classes.card}>
                        <CardContent>
                          <Typography variant="subtitle1" className={classes.cardSubtitle}>
                            {boundaryLines.boundary_line_title[index] || `Boundary ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" className={classes.bodyText}>
                            {desc}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Classification Report */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {visualizations[0]?.description || "Classification Report"}
            </Typography>
            {/* Display Overall Accuracy */}
            {accuracy !== null && (
              <Box mb={2}>
                <Typography variant="h6" className={classes.cardTitle}>
                  Overall Accuracy: {accuracy.toFixed(4)}
                </Typography>
              </Box>
            )}
            {/* Render Classification Report Table */}
            {renderClassificationReport()}
          </Box>

          {/* Confusion Matrix */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {visualizations[1]?.title || "혼동 행렬"}
            </Typography>
            {confusionMatrixData && (
              <Plot
                data={confusionMatrixData.data}
                layout={confusionMatrixData.layout}
                config={{ responsive: true }}
              />
            )}
            {/* Insights for Confusion Matrix */}
            {visualizations[1]?.insights && (
              <Typography
                variant="body2"
                gutterBottom
                className={classes.bodyText}
              >
                {visualizations[1].insights}
              </Typography>
            )}
          </Box>

          {/* Feature Importance */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {feature_importance?.key_features_title || "Feature Importance"}
            </Typography>
            {feature_importance?.key_features.map((feature, index) => (
              <Card key={index} variant="outlined" className={classes.card}>
                <CardContent>
                  <Typography variant="h6" className={classes.cardTitle}>
                    {feature.feature_name}
                  </Typography>
                  <Typography variant="body1" className={classes.bodyText}>
                    {feature.business_impact}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {feature_importance?.relationships.map((rel, index) => (
              <Card key={index} variant="outlined" className={classes.card}>
                <CardContent>
                  <Typography variant="h6" className={classes.cardTitle}>
                    관계 {index + 1}
                  </Typography>
                  <Typography variant="body1" className={classes.bodyText}>
                    {rel.description}
                  </Typography>
                  <Typography variant="body1" className={classes.bodyText}>
                    {rel.business_insight}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Key Findings */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {explanation.key_findings_section_title || "주요 발견사항"}
            </Typography>
            {key_findings.map((finding, index) => (
              <Card key={index} variant="outlined" className={classes.card}>
                <CardContent className={classes.cardContent}>
                  <Typography variant="h6" className={classes.cardTitle}>
                    {finding.finding}
                  </Typography>
                  <Typography variant="body1" className={classes.cardSubtitle}>
                    {finding.impact_label || "영향"}: {finding.impact}
                  </Typography>
                  <Typography variant="body1" className={classes.bodyText}>
                    {finding.recommendation_label || "권장사항"}:{" "}
                    {finding.recommendation}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Recommendations */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {explanation.recommendations_section_title || "권장사항"}
            </Typography>
            {recommendations.immediate_actions &&
              recommendations.immediate_actions.length > 0 && (
                <>
                  <Typography
                    variant="h6"
                    gutterBottom
                    className={classes.sectionTitle}
                  >
                    {recommendations.immediate_actions_title ||
                      "즉각적인 조치"}
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
            {recommendations.further_analysis &&
              recommendations.further_analysis.length > 0 && (
                <>
                  <Typography
                    variant="h6"
                    gutterBottom
                    className={classes.sectionTitle}
                  >
                    {recommendations.further_analysis_title || "추가 분석"}
                  </Typography>
                  <ul>
                    {recommendations.further_analysis.map((action, index) => (
                      <li key={index} className={classes.listItem}>
                        <Typography variant="body1">{action}</Typography>
                      </li>
                    ))}
                  </ul>
                </>
              )}
          </Box>
        </>
      )}
    </Container>
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
      confusion_matrix: PropTypes.arrayOf(
        PropTypes.arrayOf(PropTypes.number)
      ),
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
    If_model_is_LogisticRegression_Case: PropTypes.shape({
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
