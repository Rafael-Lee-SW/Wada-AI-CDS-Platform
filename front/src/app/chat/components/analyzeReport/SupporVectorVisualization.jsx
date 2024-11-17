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

function SVMVisualization({ result, explanation }) {
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
  const { overview = {} } = explanation;
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

    // Find decision boundary points (z ~ 0)
    const decisionBoundaryPoints = X_vis.filter((_, index) => {
      const zValue = Z[Math.floor(index / Z[0].length)][index % Z[0].length];
      return Math.abs(zValue) < 0.05; // Adjust threshold as needed for better representation
    });

    return (
      <div>
        <Plot
          data={[
            // Contour plot for the decision boundary
            {
              x: xx[0],
              y: yy.map((row) => row[0]),
              z: Z,
              type: "contour",
              contours: {
                start: -1,
                end: 1,
                size: 0.1,
              },
              colorscale: [
                [0, "blue"],
                [0.5, "white"],
                [1, "yellow"],
              ],
              showscale: true,
              colorbar: {
                title: "결정 함수 값 (z)",
                tickvals: [-1, 0, 1],
                ticktext: ["Class 2", "Decision Boundary", "Class 1"],
              },
            },
            // Data points with class colors
            {
              x: X_vis.map((d) => d[0]),
              y: X_vis.map((d) => d[1]),
              mode: "markers",
              type: "scatter",
              marker: {
                color: y_vis,
                colorscale: [
                  [0, "green"],
                  [1, "red"],
                ],
                showscale: true,
                colorbar: {
                  title: "데이터 클래스",
                  tickvals: [0, 1],
                  ticktext: ["Class 2", "Class 1"],
                },
              },
            },
            // Decision boundary points (white markers)
            {
              x: decisionBoundaryPoints.map((point) => point[0]),
              y: decisionBoundaryPoints.map((point) => point[1]),
              mode: "markers",
              type: "scatter",
              marker: {
                color: "white",
                size: 8,
                symbol: "circle",
                line: {
                  color: "black",
                  width: 1,
                },
              },
              name: "Decision Boundary Points",
            },
          ]}
          layout={{
            title: "결정 경계 시각화",
            xaxis: {
              title: explanation.SupportVectorMachine_case?.Decision_Boundary_Graph[
                "x_axis_title"
              ] || "주성분 1",
            },
            yaxis: {
              title: explanation.SupportVectorMachine_case?.Decision_Boundary_Graph[
                "y_axis_title"
              ] || "주성분 2",
            },
            height: 600,
            margin: { t: 50, l: 50, r: 50, b: 100 },
          }}
          config={{ responsive: true }}
        />
        <div>
          <h3>해석:</h3>
          <ul>
            <li>
              <strong>결정 경계 (z=0):</strong> 클래스 1과 클래스 2의 분류 경계. 흰색 영역으로 나타남.
            </li>
            <li>
              <strong>양수 영역 (z&gt;0):</strong> 클래스 1로 분류되는 영역 (노란색).
            </li>
            <li>
              <strong>음수 영역 (z&lt;0):</strong> 클래스 2로 분류되는 영역 (파란색).
            </li>
            <li>
              <strong>흰색 점:</strong> 결정 경계 근처에 위치한 데이터 포인트. 모델이 불확실성을 가지며 분류하기 어려운 영역.
            </li>
            <li>
              <strong>녹색 점:</strong> 클래스 2 데이터 포인트.
            </li>
            <li>
              <strong>빨간 점:</strong> 클래스 1 데이터 포인트.
            </li>
          </ul>
        </div>
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
    );
  };

  // Render Classification Report
  const renderClassificationReport = () => {
    if (!classificationReportData.classification_report) return null;

    const report = classificationReportData.classification_report;
    const classes = Object.keys(report).filter(
      (key) => !["accuracy", "macro avg", "weighted avg"].includes(key)
    );

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
            {classes.map((cls) => (
              <TableRow key={cls}>
                <TableCell>{cls}</TableCell>
                <TableCell>
                  {report[cls]["precision"].toFixed(2)}
                </TableCell>
                <TableCell>{report[cls]["recall"].toFixed(2)}</TableCell>
                <TableCell>{report[cls]["f1-score"].toFixed(2)}</TableCell>
                <TableCell>{report[cls]["support"]}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} />
            </TableRow>
            {["accuracy", "macro avg", "weighted avg"].map(
              (avg) =>
                report[avg] && (
                  <TableRow key={avg}>
                    <TableCell>{avg}</TableCell>
                    <TableCell>
                      {report[avg]["precision"]
                        ? report[avg]["precision"].toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {report[avg]["recall"]
                        ? report[avg]["recall"].toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {report[avg]["f1-score"]
                        ? report[avg]["f1-score"].toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {report[avg]["support"] ? report[avg]["support"] : "-"}
                    </TableCell>
                  </TableRow>
                )
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render Regression Plot
  const renderRegressionPlot = () => {
    if (!result.graph1) return null;

    const X_vis = result.graph1.X_vis;
    const y_vis = result.graph1.y_vis;
    const y_pred = result.graph1.y_pred;

    return (
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
    );
  };

  // Render Regression Metrics
  const renderRegressionMetrics = () => {
    return (
      <div className="space-y-2">
        <p>
          Mean Squared Error (MSE): {mse ? mse.toFixed(2) : "N/A"}
        </p>
        <p>
          R² Score: {r2Score ? r2Score.toFixed(2) : "N/A"}
        </p>
      </div>
    );
  };

  // --- Final Return ---
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Report Title */}
      <h1 className="text-4xl font-bold text-center mb-8">
        {explanation.SupportVectorMachine_case?.report_title ||
          "Analysis Report"}
      </h1>

      {/* Overview */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Analysis Overview</h2>
        <p>{overview?.analysis_purpose}</p>
        <p>{overview?.data_description}</p>
        <p>{overview?.models_used?.model_description}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roc_curve" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {isClassification && (
            <>
              <TabsTrigger value="roc_curve">
                {visualizationsInfo[0]?.title || "ROC Curve"}
              </TabsTrigger>
              <TabsTrigger value="decision_boundary">
                {visualizationsInfo[1]?.title || "Decision Boundary"}
              </TabsTrigger>
              <TabsTrigger value="confusion_matrix">
                {visualizationsInfo[2]?.title || "Confusion Matrix"}
              </TabsTrigger>
            </>
          )}
          {isRegression && (
            <>
              <TabsTrigger value="regression_plot">
                {"Actual vs Predicted"}
              </TabsTrigger>
              <TabsTrigger value="regression_metrics">
                {"Regression Metrics"}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Classification Tabs */}
        {isClassification && (
          <>
            {/* ROC Curve Tab */}
            <TabsContent value="roc_curve">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizationsInfo[0]?.title || "ROC Curve"}
                  </CardTitle>
                  <CardDescription>
                    {visualizationsInfo[0]?.description ||
                      "Receiver Operating Characteristic Curve"}
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderRocCurve()}</CardContent>
              </Card>
            </TabsContent>

            {/* Decision Boundary Tab */}
            <TabsContent value="decision_boundary">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizationsInfo[1]?.title || "Decision Boundary"}
                  </CardTitle>
                  <CardDescription>
                    {visualizationsInfo[1]?.description ||
                      "Visualization of decision boundaries"}
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderDecisionBoundary()}</CardContent>
              </Card>
            </TabsContent>

            {/* Confusion Matrix Tab */}
            <TabsContent value="confusion_matrix">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizationsInfo[2]?.title || "Confusion Matrix"}
                  </CardTitle>
                  <CardDescription>
                    {visualizationsInfo[2]?.description ||
                      "Confusion matrix of classification results"}
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderConfusionMatrix()}</CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {/* Regression Tabs */}
        {isRegression && (
          <>
            {/* Regression Plot Tab */}
            <TabsContent value="regression_plot">
              <Card>
                <CardHeader>
                  <CardTitle>Actual vs Predicted</CardTitle>
                </CardHeader>
                <CardContent>{renderRegressionPlot()}</CardContent>
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
          </>
        )}
      </Tabs>

      {/* Classification Report */}
      {isClassification && (
        <Card>
          <CardHeader>
            <CardTitle>Classification Report</CardTitle>
          </CardHeader>
          <CardContent>{renderClassificationReport()}</CardContent>
        </Card>
      )}

      {/* Key Findings and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle>Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {keyFindings.map((finding, index) => (
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
            {recommendations.immediate_actions &&
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
            {recommendations.further_analysis &&
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
