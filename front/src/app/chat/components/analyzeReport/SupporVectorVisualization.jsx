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

// Custom Styles (Assuming you have a similar styles file)
import useSVMStyles from "/styles/analyzingSvmStyle.js";

function SVMVisualization({ result, explanation }) {
  const classes = useSVMStyles();

  // Destructure data from result and explanation
  const { graph1, graph2, graph3, graph4, model } = result || {};

  // Destructure explanation with deeper nesting
  const {
    overview = {},
    model_performance = {},
    visualizations = [],
    key_findings = [],
    recommendations = {},
    model_specific_details = {},
    overview_section_title = "개요",
    key_findings_section_title = "주요 발견 사항",
    recommendations_section_title = "권장 사항",
    data_table_title = "모든 데이터 포인트",
    data_table_description = "모든 데이터 포인트의 상세 정보를 확인할 수 있습니다.",
  } = explanation || {};

  // Extract SupportVectorMachine_case from nested structure
  const svmCase = model_specific_details?.details?.svm_case || {};

  const {
    report_title: svmReportTitle = "Support Vector Machine Analysis Report",
    Decision_Boundary_Graph = {},
    Classification_Report = {},
  } = svmCase;

  // Extract axis titles and descriptions from nested Decision_Boundary_Graph
  const xAxisTitle =
    Decision_Boundary_Graph?.["x-axis_title"] || "주성분 1";
  const xAxisDescription =
    Decision_Boundary_Graph?.["x-axis_description"] ||
    "PC1은 데이터의 첫 번째 주성분으로, 주요 요인을 대표합니다.";
  const yAxisTitle =
    Decision_Boundary_Graph?.["y-axis_title"] || "주성분 2";
  const yAxisDescription =
    Decision_Boundary_Graph?.["y-axis_description"] ||
    "PC2는 데이터의 두 번째 주성분으로, 첫번째 주성분간의 추가적인 변동성을 설명합니다.";

  // --- Visualization Functions ---

  // Render ROC Curve
  const renderRocCurve = () => {
    if (!graph1 || !graph1.fpr || !graph1.tpr) {
      return (
        <p className="text-red-500">
          ROC Curve를 렌더링할 수 없습니다. 데이터가 누락되었습니다.
        </p>
      );
    }

    return (
      <Plot
        data={[
          {
            x: graph1.fpr,
            y: graph1.tpr,
            type: "scatter",
            mode: "lines",
            name: "ROC Curve",
            line: { color: "blue" },
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
          title: visualizations?.[0]?.title || "ROC Curve",
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
      return (
        <p className="text-red-500">
          결정 경계 시각화를 렌더링할 수 없습니다. 데이터가 누락되었습니다.
        </p>
      );

    const { X_vis, y_vis, xx, yy, Z } = decisionBoundaryData;

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
              title: xAxisTitle,
            },
            yaxis: {
              title: yAxisTitle,
            },
            height: 600,
            margin: { t: 50, l: 50, r: 50, b: 100 },
          }}
          config={{ responsive: true }}
        />
        <div className="mt-4">
          <h3 className="text-lg font-semibold">해석:</h3>
          <ul className="list-disc pl-5 space-y-2">
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
    if (!confusionMatrixData.confusion_matrix || !confusionMatrixData.labels) {
      return (
        <p className="text-red-500">
          혼동 행렬을 렌더링할 수 없습니다. 데이터가 누락되었습니다.
        </p>
      );
    }

    const { confusion_matrix, labels } = confusionMatrixData;

    return (
      <Plot
        data={[
          {
            z: confusion_matrix,
            x: labels,
            y: labels,
            type: "heatmap",
            colorscale: "Blues",
            showscale: false,
            text: confusion_matrix.map((row) => row.map((value) => value.toString())),
            hoverinfo: "text",
            texttemplate: "%{text}",
          },
        ]}
        layout={{
          title: visualizationsInfo[2]?.title || "혼동 행렬",
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
    if (!Classification_Report.classification_report) return null;

    const report = Classification_Report.classification_report;
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

  // Render Data Table for All Spots
  const renderDataTable = () => {
    if (!result.graph4 || !result.graph4.all_data) return null;

    const dataTable = result.graph4.all_data.map((row, index) => ({
      id: index,
      Identifier: row.identifier,
      Actual: row.actual,
      Predicted: row.predicted,
    }));

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identifier</TableHead>
              <TableHead>Actual Value</TableHead>
              <TableHead>Predicted Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataTable.map((row) => (
              <TableRow key={row.id}>
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

  // --- Final Return ---
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Report Title */}
      <h1 className="text-4xl font-bold text-center mb-8">
        {svmReportTitle || "Support Vector Machine Analysis Report"}
      </h1>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{overview_section_title || "개요"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography variant="h6" style={{ paddingBottom: "10px" }}>
            ◾ 분석 목적
          </Typography>
          <Typography variant="body1" gutterBottom>
            {overview?.analysis_purpose ||
              "분석 목적이 제공되지 않았습니다."}
          </Typography>

          <Typography variant="h6" style={{ paddingBottom: "10px" }}>
            ◾ 데이터 설명
          </Typography>
          <Typography variant="body1" gutterBottom>
            {overview?.data_description ||
              "데이터 설명이 제공되지 않았습니다."}
          </Typography>

          <Typography variant="h6" style={{ paddingBottom: "10px" }}>
            ◾ 사용된 모델
          </Typography>
          <Typography variant="body1" gutterBottom>
            {overview?.models_used?.model_description ||
              "모델 설명이 제공되지 않았습니다."}
          </Typography>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="roc_curve" className="w-full">
        <TabsList className="grid w-full grid-cols-3 space-x-4">
          {isClassification && (
            <>
              <TabsTrigger
                value="roc_curve"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations?.[0]?.title || "ROC Curve"}
              </TabsTrigger>
              <TabsTrigger
                value="decision_boundary"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations?.[1]?.title || "Decision Boundary"}
              </TabsTrigger>
              <TabsTrigger
                value="confusion_matrix"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations?.[2]?.title || "Confusion Matrix"}
              </TabsTrigger>
            </>
          )}
          {isRegression && (
            <>
              <TabsTrigger
                value="regression_plot"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {"Actual vs Predicted"}
              </TabsTrigger>
              <TabsTrigger
                value="regression_metrics"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
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
                    {visualizations?.[0]?.title || "ROC Curve"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations?.[0]?.description ||
                      "Receiver Operating Characteristic Curve"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={classes.plotContainer}>
                  {renderRocCurve()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Decision Boundary Tab */}
            <TabsContent value="decision_boundary">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations?.[1]?.title || "Decision Boundary"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations?.[1]?.description ||
                      "Visualization of decision boundaries"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={classes.plotContainer}>
                  {renderDecisionBoundary()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Confusion Matrix Tab */}
            <TabsContent value="confusion_matrix">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations?.[2]?.title || "Confusion Matrix"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations?.[2]?.description ||
                      "Confusion matrix of classification results"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={classes.plotContainer}>
                  {renderConfusionMatrix()}
                </CardContent>
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
            <CardTitle>분류 리포트</CardTitle>
          </CardHeader>
          <CardContent>{renderClassificationReport()}</CardContent>
        </Card>
      )}

      {/* Key Findings and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#8770b4" }}>주목할만한 부분</CardTitle>
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
            <CardTitle>추천</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.immediate_actions &&
              recommendations.immediate_actions.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    즉각적인 조치
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
                    추가 분석
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.further_analysis.map(
                      (action, index) => (
                        <li key={index}>{action}</li>
                      )
                    )}
                  </ul>
                </>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Define PropTypes for type checking
SVMVisualization.propTypes = {
  result: PropTypes.shape({
    model: PropTypes.string.isRequired,
    accuracy: PropTypes.number,
    roc_auc_score: PropTypes.number,
    mse: PropTypes.number,
    r2_score: PropTypes.number,
    graph1: PropTypes.shape({
      fpr: PropTypes.arrayOf(PropTypes.number).isRequired,
      tpr: PropTypes.arrayOf(PropTypes.number).isRequired,
    }),
    graph2: PropTypes.shape({
      X_vis: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
      y_vis: PropTypes.arrayOf(PropTypes.number).isRequired,
      xx: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
      yy: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
      Z: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
    }),
    graph3: PropTypes.shape({
      classification_report: PropTypes.object.isRequired,
    }),
    graph4: PropTypes.shape({
      confusion_matrix: PropTypes.arrayOf(
        PropTypes.arrayOf(PropTypes.number)
      ).isRequired,
      labels: PropTypes.arrayOf(PropTypes.string).isRequired,
      all_data: PropTypes.arrayOf(
        PropTypes.shape({
          identifier: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          actual: PropTypes.number.isRequired,
          predicted: PropTypes.number.isRequired,
        })
      ),
    }),
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
    model_specific_details: PropTypes.shape({
      details: PropTypes.shape({
        svm_case: PropTypes.shape({
          report_title: PropTypes.string,
          Decision_Boundary_Graph: PropTypes.shape({
            "x-axis_title": PropTypes.string,
            "x-axis_description": PropTypes.string,
            "y-axis_title": PropTypes.string,
            "y-axis_description": PropTypes.string,
          }),
          Classification_Report: PropTypes.object.isRequired,
        }),
      }),
    }),
    overview_section_title: PropTypes.string,
    key_findings_section_title: PropTypes.string,
    recommendations_section_title: PropTypes.string,
    data_table_title: PropTypes.string,
    data_table_description: PropTypes.string, // Added for data table description
  }).isRequired,
};

export default SVMVisualization;
