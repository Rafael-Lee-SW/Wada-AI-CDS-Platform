// src/app/chat/components/analyzeReport/SupporVectorVisualization.js

import React, { useState, useEffect } from "react";
// Plotly.js for interactive charts
import dynamic from "next/dynamic";
// Material-UI components
import {
  Typography,
  Card,
  CardContent,
  Box,
  Container,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import useAnalyzingSvmStyles from "/styles/analyzingSvmStyle.js"; // Custom styles
import PropTypes from "prop-types"; // Prop types validation

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// This component visualizes Support Vector Machine results for both classification and regression.
function SVMVisualization({ result, explanation }) {
  const classes = useAnalyzingSvmStyles();

  // Extract necessary data from the result prop
  const modelType = result.model.toLowerCase();
  const isClassification = modelType.includes("classifier");
  const isRegression = modelType.includes("regressor");

  // Extract data for visualizations
  const rocData = result.graph1 || {};
  const decisionBoundaryData = result.graph2 || {};
  const classificationReportData = result.graph3 || {};
  const confusionMatrixData = result.graph4 || {};

  // Extract performance metrics
  const accuracy = result.accuracy;
  const rocAucScore = result.roc_auc_score;
  const mse = result.mse;
  const r2Score = result.r2_score;

  // Extract explanation data
  const { analysis_purpose, data_description, models_used } =
    explanation.overview || {};

  const keyFindings = explanation.key_findings || [];
  const recommendations = explanation.recommendations || {};
  const visualizationsInfo = explanation.visualizations || [];
  const classificationReportExplanation =
    explanation.SupportVectorMachine_case?.Classification_Report || {};

  // --- Visualization Functions ---

  // Render ROC Curve
  const renderRocCurve = () => {
    if (!rocData.fpr || !rocData.tpr) return null;

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              x: rocData.fpr,
              y: rocData.tpr,
              type: "scatter",
              mode: "lines",
              name: "ROC Curve",
            },
            {
              x: [0, 1],
              y: [0, 1],
              type: "scatter",
              mode: "lines",
              name: "Random Classifier",
              line: { dash: "dash" },
            },
          ]}
          layout={{
            title: visualizationsInfo[0]?.title || "ROC Curve",
            xaxis: { title: "False Positive Rate" },
            yaxis: { title: "True Positive Rate" },
            height: 500,
            legend: { orientation: "h", x: 0, y: -0.2 },
            margin: { t: 50, l: 50, r: 50, b: 100 },
          }}
          config={{ responsive: true }}
        />
        {/* Visualization description */}
        {visualizationsInfo[0]?.description && (
          <Typography variant="body2" className={classes.bodyText}>
            {visualizationsInfo[0].description}
          </Typography>
        )}
        {/* Insights */}
        {visualizationsInfo[0]?.insights && (
          <Typography variant="body2" className={classes.bodyText}>
            {visualizationsInfo[0].insights}
          </Typography>
        )}
      </div>
    );
  };

  // Render Decision Boundary
  const renderDecisionBoundary = () => {
    if (
      !decisionBoundaryData.X_vis ||
      !decisionBoundaryData.y_vis ||
      !decisionBoundaryData.xx ||
      !decisionBoundaryData.yy ||
      !decisionBoundaryData.Z
    )
      return null;

    const X_vis = decisionBoundaryData.X_vis;
    const y_vis = decisionBoundaryData.y_vis;
    const xx = decisionBoundaryData.xx;
    const yy = decisionBoundaryData.yy;
    const Z = decisionBoundaryData.Z;

    // Flatten the grid for plotting
    const xMin = Math.min(...X_vis.map((d) => d[0]));
    const xMax = Math.max(...X_vis.map((d) => d[0]));
    const yMin = Math.min(...X_vis.map((d) => d[1]));
    const yMax = Math.max(...X_vis.map((d) => d[1]));

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              x: X_vis.map((d) => d[0]),
              y: X_vis.map((d) => d[1]),
              mode: "markers",
              type: "scatter",
              marker: {
                color: y_vis,
                colorscale: "Viridis",
                showscale: false,
              },
            },
            {
              x: xx.flat(),
              y: yy.flat(),
              z: Z.flat(),
              type: "contour",
              contours: {
                start: -1,
                end: 1,
                size: 0.5,
              },
              showscale: false,
              opacity: 0.5,
            },
          ]}
          layout={{
            title: visualizationsInfo[1]?.title || "Decision Boundary",
            xaxis: { title: explanation.SupportVectorMachine_case?.Decision_Boundary_Graph["x-axis_title"] || "Feature 1" },
            yaxis: { title: explanation.SupportVectorMachine_case?.Decision_Boundary_Graph["y-axis_title"] || "Feature 2" },
            height: 600,
            margin: { t: 50, l: 50, r: 50, b: 100 },
          }}
          config={{ responsive: true }}
        />
        {/* Axis descriptions */}
        {explanation.SupportVectorMachine_case?.Decision_Boundary_Graph["x-axis_description"] && (
          <Typography variant="body2" className={classes.bodyText}>
            {explanation.SupportVectorMachine_case.Decision_Boundary_Graph["x-axis_description"]}
          </Typography>
        )}
        {explanation.SupportVectorMachine_case?.Decision_Boundary_Graph["y-axis_description"] && (
          <Typography variant="body2" className={classes.bodyText}>
            {explanation.SupportVectorMachine_case.Decision_Boundary_Graph["y-axis_description"]}
          </Typography>
        )}
        {/* Visualization description */}
        {visualizationsInfo[1]?.description && (
          <Typography variant="body2" className={classes.bodyText}>
            {visualizationsInfo[1].description}
          </Typography>
        )}
        {/* Insights */}
        {visualizationsInfo[1]?.insights && (
          <Typography variant="body2" className={classes.bodyText}>
            {visualizationsInfo[1].insights}
          </Typography>
        )}
      </div>
    );
  };

  // Render Confusion Matrix
  const renderConfusionMatrix = () => {
    if (
      !confusionMatrixData.confusion_matrix ||
      !confusionMatrixData.labels
    )
      return null;

    const matrix = confusionMatrixData.confusion_matrix;
    const labels = confusionMatrixData.labels;

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              z: matrix,
              x: labels,
              y: labels,
              type: "heatmap",
              colorscale: "Blues",
              showscale: false,
              text: matrix.map((row) => row.map((value) => value.toString())),
              hoverinfo: "text",
              texttemplate: "%{text}",
            },
          ]}
          layout={{
            title: visualizationsInfo[2]?.title || "Confusion Matrix",
            xaxis: { title: "Predicted Label" },
            yaxis: { title: "True Label" },
            height: 500,
            margin: { t: 50, l: 50, r: 50, b: 100 },
          }}
          config={{ responsive: true }}
        />
        {/* Visualization description */}
        {visualizationsInfo[2]?.description && (
          <Typography variant="body2" className={classes.bodyText}>
            {visualizationsInfo[2].description}
          </Typography>
        )}
        {/* Insights */}
        {visualizationsInfo[2]?.insights && (
          <Typography variant="body2" className={classes.bodyText}>
            {visualizationsInfo[2].insights}
          </Typography>
        )}
      </div>
    );
  };

  // Render Classification Report
  const renderClassificationReport = () => {
    if (!classificationReportData.classification_report) return null;

    const report = classificationReportData.classification_report;
    const classes = Object.keys(report).filter((key) => !["accuracy", "macro avg", "weighted avg"].includes(key));

    return (
      <Paper className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class</TableCell>
              <TableCell>Precision</TableCell>
              <TableCell>Recall</TableCell>
              <TableCell>F1-Score</TableCell>
              <TableCell>Support</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((cls) => (
              <TableRow key={cls}>
                <TableCell>{cls}</TableCell>
                <TableCell>{report[cls]["precision"].toFixed(2)}</TableCell>
                <TableCell>{report[cls]["recall"].toFixed(2)}</TableCell>
                <TableCell>{report[cls]["f1-score"].toFixed(2)}</TableCell>
                <TableCell>{report[cls]["support"]}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} />
            </TableRow>
            {["accuracy", "macro avg", "weighted avg"].map((avg) => (
              report[avg] && (
                <TableRow key={avg}>
                  <TableCell>{avg}</TableCell>
                  <TableCell>{report[avg]["precision"] ? report[avg]["precision"].toFixed(2) : "-"}</TableCell>
                  <TableCell>{report[avg]["recall"] ? report[avg]["recall"].toFixed(2) : "-"}</TableCell>
                  <TableCell>{report[avg]["f1-score"] ? report[avg]["f1-score"].toFixed(2) : "-"}</TableCell>
                  <TableCell>{report[avg]["support"] ? report[avg]["support"] : "-"}</TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  };

  // Render Regression Plot
  const renderRegressionPlot = () => {
    if (!result.graph1) return null;

    const X_vis = result.graph1.X_vis;
    const y_vis = result.graph1.y_vis;
    const y_pred = result.graph1.y_pred;

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              x: X_vis,
              y: y_vis,
              mode: "markers",
              type: "scatter",
              name: "Actual",
            },
            {
              x: X_vis,
              y: y_pred,
              mode: "markers",
              type: "scatter",
              name: "Predicted",
            },
          ]}
          layout={{
            title: "Actual vs Predicted",
            xaxis: { title: "Feature 1" },
            yaxis: { title: "Target" },
            height: 500,
            margin: { t: 50, l: 50, r: 50, b: 100 },
            legend: { orientation: "h", x: 0, y: -0.2 },
          }}
          config={{ responsive: true }}
        />
      </div>
    );
  };

  // Render Regression Metrics
  const renderRegressionMetrics = () => {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" className={classes.cardTitle}>
            모델 성능 지표
          </Typography>
          <Typography variant="body1" className={classes.bodyText}>
            평균 제곱 오차 (MSE): {mse ? mse.toFixed(2) : "N/A"}
          </Typography>
          <Typography variant="body1" className={classes.bodyText}>
            결정 계수 (R² 점수): {r2Score ? r2Score.toFixed(2) : "N/A"}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // --- Final Return ---
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
          {explanation.SupportVectorMachine_case?.report_title || "분석 보고서"}
        </Typography>
      </Box>

      {/* Analysis Overview */}
      <Box my={4}>
        <Typography
          variant="h5"
          gutterBottom
          className={classes.sectionTitle}
        >
          분석 개요
        </Typography>
        <Typography variant="body1" className={classes.bodyText}>
          {analysis_purpose}
        </Typography>
        <Typography variant="body1" className={classes.bodyText}>
          {data_description}
        </Typography>
        <Typography variant="body1" className={classes.bodyText}>
          {models_used?.model_description}
        </Typography>
      </Box>

      {/* Key Findings */}
      <Box my={4}>
        <Typography
          variant="h5"
          gutterBottom
          className={classes.sectionTitle}
        >
          주요 발견사항
        </Typography>
        {keyFindings.map((finding, index) => (
          <Card key={index} className={classes.card}>
            <CardContent>
              <Typography variant="h6" className={classes.cardTitle}>
                {finding.finding}
              </Typography>
              <Typography variant="body1" className={classes.bodyText}>
                영향: {finding.impact}
              </Typography>
              <Typography variant="body1" className={classes.bodyText}>
                권장사항: {finding.recommendation}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Visualizations */}
      {isClassification && (
        <>
          {/* ROC Curve */}
          <Box my={4}>
            {renderRocCurve()}
          </Box>

          {/* Decision Boundary */}
          <Box my={4}>
            {renderDecisionBoundary()}
          </Box>

          {/* Confusion Matrix */}
          <Box my={4}>
            {renderConfusionMatrix()}
          </Box>

          {/* Classification Report */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              분류 보고서
            </Typography>
            {renderClassificationReport()}
            {/* Classification Report Explanation */}
            {Object.keys(classificationReportExplanation).length > 0 && (
              <Box mt={2}>
                {Object.entries(classificationReportExplanation).map(
                  ([feature, description], index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      className={classes.bodyText}
                    >
                      <strong>{feature}:</strong> {description}
                    </Typography>
                  )
                )}
              </Box>
            )}
          </Box>
        </>
      )}

      {isRegression && (
        <>
          {/* Regression Plot */}
          <Box my={4}>
            {renderRegressionPlot()}
          </Box>

          {/* Regression Metrics */}
          <Box my={4}>
            {renderRegressionMetrics()}
          </Box>
        </>
      )}

      {/* Recommendations */}
      <Box my={4}>
        <Typography
          variant="h5"
          gutterBottom
          className={classes.sectionTitle}
        >
          권장사항
        </Typography>
        {recommendations.immediate_actions &&
          recommendations.immediate_actions.length > 0 && (
            <>
              <Typography variant="h6" className={classes.sectionTitle}>
                즉각적인 조치
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
              <Typography variant="h6" className={classes.sectionTitle}>
                추가 분석
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
    </Container>
  );
}

// Define prop types for validation
SVMVisualization.propTypes = {
  result: PropTypes.shape({
    model: PropTypes.string.isRequired,
    accuracy: PropTypes.number,
    roc_auc_score: PropTypes.number,
    mse: PropTypes.number,
    r2_score: PropTypes.number,
    graph1: PropTypes.object,
    graph2: PropTypes.object,
    graph3: PropTypes.object,
    graph4: PropTypes.object,
  }).isRequired,
  explanation: PropTypes.shape({
    overview: PropTypes.shape({
      analysis_purpose: PropTypes.string,
      data_description: PropTypes.string,
      models_used: PropTypes.shape({
        model_description: PropTypes.string,
      }),
    }),
    key_findings: PropTypes.arrayOf(
      PropTypes.shape({
        finding: PropTypes.string,
        impact: PropTypes.string,
        recommendation: PropTypes.string,
      })
    ),
    recommendations: PropTypes.shape({
      immediate_actions: PropTypes.arrayOf(PropTypes.string),
      further_analysis: PropTypes.arrayOf(PropTypes.string),
    }),
    visualizations: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        insights: PropTypes.string,
      })
    ),
    SupportVectorMachine_case: PropTypes.shape({
      report_title: PropTypes.string,
      Decision_Boundary_Graph: PropTypes.shape({
        "x-axis_title": PropTypes.string,
        "x-axis_description": PropTypes.string,
        "y-axis_title": PropTypes.string,
        "y-axis_description": PropTypes.string,
      }),
      Classification_Report: PropTypes.object,
    }),
  }).isRequired,
};

export default SVMVisualization;
