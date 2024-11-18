"use client";

import React from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

// 직접 정의한 UI 컴포넌트(Card, tabs, table etc...)
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
import { Typography } from "@mui/material";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Custom Styles
import useAnalyzingKmeansStyles from "/styles/analyzingKmeansStyle.js";

export default function RandomForestRegressorVisualization({
  result,
  explanation,
}) {
  const classes = useAnalyzingKmeansStyles();

  // Destructure explanation with default values
  const {
    overview = {},
    key_findings = [],
    recommendations = {},
    visualizations = [],
    report_title = "랜덤 포레스트 AI 모델 분석 보고서",
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
          title: visualizations[0]?.title || "특성 중요도",
          xaxis: {
            title: "특성",
            automargin: true,
          },
          yaxis: {
            title: "중요도",
            tickformat: ".0%",
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
      console.error("유효하지 않은 특성 중요도 데이터:", mse, r2);
      return null;
    }

    const metrics = [
      {
        Metric: "평균 제곱 오차 (MSE)",
        Value: mse.toFixed(4),
      },
      {
        Metric: "R² 점수",
        Value: r2.toFixed(4),
      },
    ];

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>매트릭(Metric)</TableHead>
              <TableHead>값</TableHead>
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
      console.error("유효하지 않거나 누락된 graph2 데이터:", result.graph2);
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
              "%{text}<br>실제 값: %{x}<br>예측 값: %{y}<extra></extra>",
          },
          {
            type: "scatter",
            mode: "lines",
            x: [Math.min(...y_test, ...y_pred), Math.max(...y_test, ...y_pred)],
            y: [Math.min(...y_test, ...y_pred), Math.max(...y_test, ...y_pred)],
            name: "완벽한 예측",
            line: { color: "red", dash: "dash" },
          },
        ]}
        layout={{
          title: visualizations[1]?.title || "실제 값 vs 예측 값",
          xaxis: {
            title: "실제 값",
            automargin: true,
          },
          yaxis: {
            title: "예측 값",
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
      console.error("유효하지 않거나 누락된 graph2 데이터:", result.graph2);
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
                `ID: ${item.Identifier}<br>잔차: ${item.Residual.toFixed(2)}`
            ),
            marker: { color: "green", size: 8, opacity: 0.6 },
            hovertemplate: "ID: %{x}<br>잔차: %{y}<extra></extra>",
          },
          {
            type: "scatter",
            mode: "lines",
            x: [Math.min(...identifier), Math.max(...identifier)],
            y: [0, 0],
            name: "잔차 0",
            line: { color: "red", dash: "dash" },
          },
        ]}
        layout={{
          title: "예측 값의 잔차",
          xaxis: {
            title: "멤버 식별자",
            automargin: true,
          },
          yaxis: {
            title: "잔차 (실제 값 - 예측 값)",
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
      console.error("유효하지 않거나 누락된 graph2 데이터:", result.graph2);
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
              <TableHead>식별자</TableHead>
              <TableHead>실제 값</TableHead>
              <TableHead>예측 값</TableHead>
              <TableHead>잔차</TableHead>
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
      {result && explanation && (
        <>
          <h1 className="text-4xl font-bold text-center mb-8">
            {report_title || "회귀 모델 분석 보고서"}
          </h1>

          {/* Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {explanation.overview_section_title || "개요"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="h6" style={{ padding: '0 0 10px'}}>◾ 분석 목적</Typography>
              <Typography variant="body1" gutterBottom>
                {overview.analysis_purpose ||
                  "분석 목적이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6" style={{ padding: '10px 0 10px'}}>◾ 데이터 설명</Typography>
              <Typography variant="body1" gutterBottom>
                {overview.data_description ||
                  "데이터 설명이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6" style={{ padding: '10px 0 10px'}}>◾ 사용된 모델</Typography>
              <Typography variant="body1" gutterBottom>
                {overview.models_used?.model_description ||
                  "모델 설명이 제공되지 않았습니다."}
              </Typography>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="feature_importance" className="w-full">
            <TabsList className="grid w-full grid-cols-5 space-x-4">
              <TabsTrigger
                value="feature_importance"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations[0]?.title || "특성 중요도"}
              </TabsTrigger>
              <TabsTrigger
                value="regression_metrics"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations[1]?.title || "모델 성능표"}
              </TabsTrigger>
              <TabsTrigger
                value="actual_vs_predicted"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations[2]?.title || "실제 값 vs 예측 값"}
              </TabsTrigger>
              <TabsTrigger
                value="residuals"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations[3]?.title || "잔차값(Residuals)"}
              </TabsTrigger>
              <TabsTrigger
                value="predictions_overview"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {visualizations[4]?.title || "전체 예측 데이터"}
              </TabsTrigger>
            </TabsList>
            {/* Feature Importances Tab Content */}
            <TabsContent value="feature_importance">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[0]?.title || "특성 중요도"}
                  </CardTitle>
                  <CardDescription style={{ paddingTop: '10px'}}>
                    {visualizations[0]?.description ||
                      "분석에 있어서 각 특성이 얼마나 영향을 발휘하는 지를 나타냅니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent className={classes.plotContainer}>{renderFeatureImportances()}</CardContent>
              </Card>
            </TabsContent>

            {/* Regression Metrics Tab Content */}
            <TabsContent value="regression_metrics">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[1]?.title || "모델 성능표"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[1]?.description ||
                      "회귀 모델의 성능을 보여줍니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderRegressionMetrics()}</CardContent>
              </Card>
            </TabsContent>

            {/* Actual vs Predicted Tab Content */}
            <TabsContent value="실제 값 vs 예측 값">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[2]?.title || "실제 값 vs 예측 값"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[2]?.description ||
                      "실제 값 vs 예측 값에 대한 분포도를 나타냅니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderActualVsPredictedScatter()}</CardContent>
              </Card>
            </TabsContent>

            {/* Residuals Tab Content */}
            <TabsContent value="residuals">
              <Card>
                <CardHeader>
                  <CardTitle>예측의 잔차를 나타냅니다.</CardTitle>
                  <CardDescription>
                    실제 값과 예측값의 차이를 그래프로 나타냅니다. (실제 값 - 예측 값)
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderResidualsPlot()}</CardContent>
              </Card>
            </TabsContent>

            {/* Predictions Overview Tab Content */}
            <TabsContent value="predictions_overview">
              <Card>
                <CardHeader>
                  <CardTitle>전체 예측 데이터</CardTitle>
                  <CardDescription>
                    모든 점들에 대한 실제 값, 예측 값, 잔차를 나타냅니다.
                  </CardDescription>
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
                <CardTitle>
                  {explanation.key_findings_section_title || "주목할만한 부분"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {key_findings.map((finding, index) => (
                    <li key={index} className={classes.listItem}>
                      <strong>{finding.finding}</strong>: {finding.impact}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {explanation.recommendations_section_title ||
                    "추천"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.immediate_actions &&
                  recommendations.immediate_actions.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-2">
                        즉각적인 조치
                      </h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {recommendations.immediate_actions.map(
                          (action, index) => (
                            <li key={index} className={classes.listItem}>
                              {action}
                            </li>
                          )
                        )}
                      </ul>
                    </>
                  )}
                {recommendations.further_analysis &&
                  recommendations.further_analysis.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-2">
                        향후 분석 가능성
                      </h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {recommendations.further_analysis.map(
                          (action, index) => (
                            <li key={index} className={classes.listItem}>
                              {action}
                            </li>
                          )
                        )}
                      </ul>
                    </>
                  )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Model Performance Section */}
      {result && explanation && explanation.model_performance && (
        <Card>
          <CardHeader>
            <CardTitle>
              {explanation.model_performance_section_title ||
                "모델 성능"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Render Metrics */}
            <Typography variant="h6">중요 지표</Typography>
            {explanation.model_performance.metrics.map((metric, index) => (
              <div key={index} className="mb-2">
                <Typography variant="body1">
                  <strong>{metric.metric_name}:</strong> {metric.metric_value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {metric.interpretation}
                </Typography>
              </div>
            ))}

            {/* Render Prediction Analysis */}
            {explanation.model_performance.prediction_analysis && (
              <>
                <Typography variant="h6" className="mt-4">
                  예측 모델 분석
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>정확도:</strong>{" "}
                  {
                    explanation.model_performance.prediction_analysis
                      .overall_accuracy
                  }
                </Typography>
                <Typography variant="body1">
                  <strong>주목할만한 부분:</strong>
                </Typography>
                <ul className="list-disc pl-5">
                  {explanation.model_performance.prediction_analysis.notable_patterns.map(
                    (pattern, idx) => (
                      <li key={idx}>
                        <Typography variant="body2">{pattern}</Typography>
                      </li>
                    )
                  )}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}
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
        description: PropTypes.string,
        insights: PropTypes.string,
      })
    ).isRequired,
    report_title: PropTypes.string,
    "x-axis_title": PropTypes.string,
    "x-axis_description": PropTypes.string,
    "y-axis_title": PropTypes.string,
    "y-axis_description": PropTypes.string,
    model_performance: PropTypes.shape({
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          metric_name: PropTypes.string.isRequired,
          metric_value: PropTypes.string.isRequired,
          interpretation: PropTypes.string.isRequired,
        })
      ).isRequired,
      prediction_analysis: PropTypes.shape({
        overall_accuracy: PropTypes.string,
        notable_patterns: PropTypes.arrayOf(PropTypes.string),
      }),
      model_performance_section_title: PropTypes.string,
    }),
    overview_section_title: PropTypes.string,
    model_performance_section_title: PropTypes.string,
    key_findings_section_title: PropTypes.string,
    recommendations_section_title: PropTypes.string,
  }).isRequired,
};
