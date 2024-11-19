"use client";

import React from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Typography
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

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

import useNeuralNetworkStyles from "/styles/analyzingNNStyle.js";

function NeuralNetworkVisualization({ result, explanation }) {
  const classes = useNeuralNetworkStyles();

  const { graph1, graph2, graph3, model, architecture } = result || {};
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

  const neuralNetworkCase =
    model_specific_details?.details?.neural_network_case || {};

  const {
    report_title: neuralReportTitle = "Neural Network Regressor Analysis Report",
    Predictions_vs_Actual: predictionsVsActual = {},
  } = neuralNetworkCase;

  const xAxisTitle =
    neuralNetworkCase?.["x-axis_title"] ||
    predictionsVsActual?.["x-axis_title"] ||
    "Actual Values";
  const xAxisDescription =
    neuralNetworkCase?.["x-axis_description"] ||
    predictionsVsActual?.["x-axis_description"] ||
    "실제 값은 모델이 예측한 값과 비교되는 실제 데이터 포인트입니다.";
  const yAxisTitle =
    neuralNetworkCase?.["y-axis_title"] ||
    predictionsVsActual?.["y-axis_title"] ||
    "Predicted Values";
  const yAxisDescription =
    neuralNetworkCase?.["y-axis_description"] ||
    predictionsVsActual?.["y-axis_description"] ||
    "예측 값은 모델이 실제 값에 기반하여 예측한 결과입니다.";

  const renderLossCurve = () => {
    if (!graph1 || !graph1.loss || !graph1.val_loss || !graph1.epochs) {
      return (
        <p className="text-red-500">
          Loss curve를 렌더링할 수 없습니다. 데이터가 누락되었습니다.
        </p>
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
        <p className="text-red-500">
          Loss curve를 렌더링할 수 없습니다. 데이터에 숫자가 아닌 값이 포함되어 있습니다.
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

  const renderPredictionScatter = () => {
    if (!graph2) return null;

    const { y_test, y_pred, identifiers } = graph2;

    if (!y_test || !y_pred) {
      return (
        <p className="text-red-500">
          예측 그래프를 렌더링할 수 없습니다. 데이터가 누락되었습니다.
        </p>
      );
    }

    const yTestData = y_test.map((value) => Number(value));
    const yPredData = y_pred.map((value) => Number(value));

    if (yTestData.some(isNaN) || yPredData.some(isNaN)) {
      return (
        <p className="text-red-500">
          예측 그래프를 렌더링할 수 없습니다. 데이터에 숫자가 아닌 값이 포함되어 있습니다.
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
            predictionsVsActual?.Predictions_vs_Actual_title ||
            "Predicted vs Actual Values",
          xaxis: {
            title: xAxisTitle || "Actual Values",
          },
          yaxis: {
            title: yAxisTitle || "Predicted Values",
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

  const renderDataTable = () => {
    if (!graph2 || !graph2.identifiers || !graph2.y_test || !graph2.y_pred)
      return null;

    const { identifiers, y_test, y_pred } = graph2;

    const dataTable = identifiers.map((id, index) => ({
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

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Report Title */}
      <h1 className="text-4xl font-bold text-center mb-8">
        {neuralReportTitle || "Neural Network Regressor Analysis Report"}
      </h1>

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
      <Tabs defaultValue="loss_curve" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="loss_curve">
            {visualizations?.[0]?.title || "Loss Curve"}
          </TabsTrigger>
          <TabsTrigger value="predictions">
            {predictionsVsActual?.Predictions_vs_Actual_title ||
              "Predictions vs Actual"}
          </TabsTrigger>
          <TabsTrigger value="metrics">
            {visualizations?.[2]?.title || "Performance Metrics"}
          </TabsTrigger>
        </TabsList>
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
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>
                {predictionsVsActual?.Predictions_vs_Actual_title ||
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
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>
                {visualizations?.[2]?.title || "Performance Metrics"}
              </CardTitle>
              <CardDescription>
                {visualizations?.[2]?.description ||
                  "Detailed performance metrics of the model."}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderMetricsTable()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {key_findings_section_title || "주요 발견 사항"}
            </CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>
              {recommendations_section_title || "권장 사항"}
            </CardTitle>
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
    model_specific_details: PropTypes.shape({
      details: PropTypes.shape({
        neural_network_case: PropTypes.shape({
          report_title: PropTypes.string,
          Predictions_vs_Actual: PropTypes.shape({
            Predictions_vs_Actual_title: PropTypes.string,
            "x-axis_title": PropTypes.string,
            "x-axis_description": PropTypes.string,
            "y-axis_title": PropTypes.string,
            "y-axis_description": PropTypes.string,
          }),
        }),
      }),
    }),
    overview_section_title: PropTypes.string,
    key_findings_section_title: PropTypes.string,
    recommendations_section_title: PropTypes.string,
    data_table_title: PropTypes.string,
    data_table_description: PropTypes.string, 
  }).isRequired,
};

export default NeuralNetworkVisualization;
