"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

// 직접 정의한 UI 컴포넌트(Card, Tabs, Table 등)
import { Slider } from "../ui/silder"; // 슬라이더 컴포넌트 경로 수정 필요
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

// Plotly를 동적으로 가져와 SSR 문제를 방지
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// 커스텀 스타일
import useAnalyzingKmeansStyles from "/styles/analyzingKmeansStyle.js";

export default function RandomForestClassifierVisualization({
  result,
  explanation,
}) {
  const classes = useAnalyzingKmeansStyles();

  // 슬라이더 상태 관리
  const [threshold, setThreshold] = useState(0.5);

  // 슬라이더 변경 핸들러
  const handleThresholdChange = (value) => {
    setThreshold(value[0]);
  };

  // 설명 객체에서 기본값으로 구조 분해
  const {
    overview = {},
    key_findings = [],
    recommendations = {},
    visualizations = [],
    model_specific_details = {},
    report_title = "랜덤 포레스트 분류 모델 분석 보고서",
    "x-axis_title": defaultXAxisTitle = "",
    "x-axis_description": defaultXAxisDescription = "",
    "y-axis_title": defaultYAxisTitle = "",
    "y-axis_description": defaultYAxisDescription = "",
    overview_section_title = "개요",
    key_findings_section_title = "주요 발견 사항",
    recommendations_section_title = "권장 사항",
  } = explanation;

  // Extract RandomForest_case details
  const rfCase =
    model_specific_details?.details?.random_forest_case || {};

  const {
    report_title: rfReportTitle = report_title,
    x_axis_title: rfXAxisTitle = defaultXAxisTitle,
    x_axis_description: rfXAxisDescription = defaultXAxisDescription,
    y_axis_title: rfYAxisTitle = defaultYAxisTitle,
    y_axis_description: rfYAxisDescription = defaultYAxisDescription,
  } = rfCase;

  // 특성 중요도 막대 차트를 렌더링하는 함수
  const renderFeatureImportances = () => {
    const featureImportances = result.graph1?.feature_importances;
    const featureNames = result.graph1?.feature_names;

    if (!Array.isArray(featureImportances) || !Array.isArray(featureNames)) {
      console.error(
        "유효하지 않은 특성 중요도 데이터:",
        featureImportances,
        featureNames
      );
      return null;
    }

    let df_importances = featureNames.map((feature, index) => ({
      Feature: feature,
      Importance: featureImportances[index],
    }));

    // 내림차순 정렬로 더 나은 시각화 제공
    df_importances.sort((a, b) => b.Importance - a.Importance);

    // 상위 6개 특성만 표시
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
            title: rfXAxisTitle || "특성",
            automargin: true,
          },
          yaxis: {
            title: rfYAxisTitle || "중요도",
            tickformat: ".0%",
            automargin: true,
          },
          margin: { l: 150, r: 50, t: 50, b: 50 },
          height: 600,
          template: "plotly_white",
        }}
        config={{ responsive: true }}
      />
    );
  };

  // 분류 메트릭 테이블을 렌더링하는 함수
  const renderClassificationMetrics = () => {
    const classification_report = result.graph3?.classification_report;

    if (!classification_report) {
      console.error("graph3에 classification_report가 없습니다.");
      return null;
    }

    const metrics = Object.keys(classification_report)
      .filter(
        (key) =>
          !["accuracy", "macro avg", "weighted avg"].includes(key)
      )
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
              <TableHead>클래스(Class)</TableHead>
              <TableHead>정밀도(Precision)</TableHead>
              <TableHead>재현율(Recall)</TableHead>
              <TableHead>F1-점수(F1-Score)</TableHead>
              <TableHead>지원 수(Support)</TableHead>
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
          <strong>정확도(Accuracy):</strong> {result.accuracy.toFixed(3)}
        </p>
      </div>
    );
  };

  // 혼동 행렬 히트맵을 렌더링하는 함수
  const renderConfusionMatrix = () => {
    const confusion_matrix = result.graph4?.confusion_matrix;
    const labels = result.graph4?.labels;

    if (
      !Array.isArray(confusion_matrix) ||
      !Array.isArray(labels)
    ) {
      console.error(
        "유효하지 않거나 누락된 혼동 행렬 데이터:",
        confusion_matrix,
        labels
      );
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
          title: "혼동 행렬",
          xaxis: {
            title: rfXAxisTitle || "예측 값",
            automargin: true,
          },
          yaxis: {
            title: rfYAxisTitle || "실제 값",
            automargin: true,
          },
          height: 600,
          template: "plotly_white",
        }}
        config={{ responsive: true }}
      />
    );
  };

  // 분류 확률 산점도를 렌더링하는 함수
  const renderClassificationProbabilities = () => {
    const graph2 = result.graph2;

    if (
      !graph2 ||
      !Array.isArray(graph2.y_proba) ||
      !Array.isArray(graph2.identifier) ||
      !Array.isArray(graph2.y_test) ||
      !Array.isArray(graph2.y_pred)
    ) {
      console.error("유효하지 않거나 누락된 graph2 데이터:", graph2);
      return null;
    }

    const { y_proba, identifier, y_test, y_pred } = graph2;

    // 클래스 '1'의 확률 계산
    const probabilities = y_proba.map((prob) => prob[1]);

    // 데이터 프레임 생성
    const df_prob = identifier.map((id, index) => ({
      Identifier: id,
      Probability_Class_1: probabilities[index],
      Actual: y_test[index],
      Predicted: y_pred[index],
    }));

    // 확률 기준으로 정렬
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
                  `ID: ${item.Identifier}<br>클래스 1 확률: ${item.Probability_Class_1.toFixed(
                    2
                  )}<br>분류: ${
                    item.Probability_Class_1 >= threshold
                      ? "클래스 1"
                      : "클래스 0"
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
            title: visualizations[1]?.title || "분류 확률",
            xaxis: {
              title: rfXAxisTitle || "멤버 식별자",
              automargin: true,
            },
            yaxis: {
              title: rfYAxisTitle || "클래스 1 확률",
              automargin: true,
              range: [0, 1],
            },
            height: 600,
            template: "plotly_white",
          }}
          config={{ responsive: true }}
        />
        {/* 임계값 슬라이더 */}
        <div className="mt-4">
          <label
            htmlFor="threshold-slider"
            className="block text-sm font-medium mb-2"
          >
            분류 임계값 설정: {threshold}
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

  // 예측 개요 테이블을 렌더링하는 함수
  const renderPredictionsTable = () => {
    const graph2 = result.graph2;

    if (
      !graph2 ||
      !Array.isArray(graph2.y_test) ||
      !Array.isArray(graph2.y_pred) ||
      !Array.isArray(graph2.identifier)
    ) {
      console.error(
        "예측 테이블을 위한 유효하지 않거나 누락된 graph2 데이터:",
        graph2
      );
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
              <TableHead>식별자</TableHead>
              <TableHead>실제 값</TableHead>
              <TableHead>예측 값</TableHead>
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

  // 최종 반환되는 JSX
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* 보고서 제목 */}
      <h1 className="text-4xl font-bold text-center mb-8">
        {rfReportTitle}
      </h1>

      {/* 개요 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {overview_section_title || "개요"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Typography variant="h6" style={{ padding: '0 0 10px' }}>
            ◾ 분석 목적
          </Typography>
          <Typography variant="body1" gutterBottom>
            {overview.analysis_purpose ||
              "분석 목적이 제공되지 않았습니다."}
          </Typography>

          <Typography variant="h6" style={{ padding: '10px 0' }}>
            ◾ 데이터 설명
          </Typography>
          <Typography variant="body1" gutterBottom>
            {overview.data_description ||
              "데이터 설명이 제공되지 않았습니다."}
          </Typography>

          <Typography variant="h6" style={{ padding: '10px 0' }}>
            ◾ 사용된 모델
          </Typography>
          <Typography variant="body1" gutterBottom>
            {overview.models_used?.model_description ||
              "모델 설명이 제공되지 않았습니다."}
          </Typography>
        </CardContent>
      </Card>

      {/* 탭 섹션 */}
      <Tabs defaultValue="feature_importance" className="w-full">
        <TabsList className="grid w-full grid-cols-5 space-x-4">
          <TabsTrigger
            value="feature_importance"
            className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {visualizations[0]?.title || "특성 중요도"}
          </TabsTrigger>
          <TabsTrigger
            value="classification_metrics"
            className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {visualizations[1]?.title || "모델 성능표"}
          </TabsTrigger>
          <TabsTrigger
            value="confusion_matrix"
            className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            혼동 행렬
          </TabsTrigger>
          <TabsTrigger
            value="classification_probabilities"
            className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            분류 확률
          </TabsTrigger>
          <TabsTrigger
            value="predictions_overview"
            className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {visualizations[4]?.title || "전체 예측 데이터"}
          </TabsTrigger>
        </TabsList>
        {/* 특성 중요도 탭 내용 */}
        <TabsContent value="feature_importance">
          <Card>
            <CardHeader>
              <CardTitle>
                {visualizations[0]?.title || "특성 중요도"}
              </CardTitle>
              <CardDescription>
                {visualizations[0]?.description ||
                  "분석에 있어서 각 특성이 얼마나 영향을 발휘하는지를 나타냅니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className={classes.plotContainer}>{renderFeatureImportances()}</CardContent>
          </Card>
        </TabsContent>

        {/* 모델 성능표 탭 내용 */}
        <TabsContent value="classification_metrics">
          <Card>
            <CardHeader>
              <CardTitle>
                {visualizations[1]?.title || "모델 성능표"}
              </CardTitle>
              <CardDescription>
                {visualizations[1]?.description ||
                  "분류 모델의 성능을 보여줍니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderClassificationMetrics()}</CardContent>
          </Card>
        </TabsContent>

        {/* 혼동 행렬 탭 내용 */}
        <TabsContent value="confusion_matrix">
          <Card>
            <CardHeader>
              <CardTitle>혼동 행렬</CardTitle>
              <CardDescription>
                {visualizations[2]?.description ||
                  "실제 값과 예측 값 간의 혼동 행렬을 나타냅니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className={classes.plotContainer}>{renderConfusionMatrix()}</CardContent>
          </Card>
        </TabsContent>

        {/* 분류 확률 탭 내용 */}
        <TabsContent value="classification_probabilities">
          <Card>
            <CardHeader>
              <CardTitle>
                {"분류 확률"}
              </CardTitle>
              <CardDescription>
                {visualizations[3]?.description ||
                  "각 멤버의 클래스 1에 대한 예측 확률을 나타냅니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className={classes.plotContainer}>{renderClassificationProbabilities()}</CardContent>
          </Card>
        </TabsContent>

        {/* 전체 예측 데이터 탭 내용 */}
        <TabsContent value="predictions_overview">
          <Card>
            <CardHeader>
              <CardTitle>전체 예측 데이터</CardTitle>
              <CardDescription>
                {visualizations[4]?.description ||
                  "모든 점들에 대한 실제 값, 예측 값, 잔차를 나타냅니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderPredictionsTable()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 주요 발견 사항 및 권장 사항 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 주요 발견 사항 */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#8770b4' }}>
              {key_findings_section_title || "주요 발견 사항"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {key_findings.map((finding, index) => (
                <li key={index} className={classes.listItem}>
                  <strong style={{ color: '#8770b4' }}>{finding.finding}</strong>: {finding.impact}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 권장 사항 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {recommendations_section_title || "권장 사항"}
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
                  <h3 className="text-lg font-semibold mb-2" style={{ paddingTop: '10px' }}>
                    추가 분석
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

      {/* 모델 성능 섹션 */}
      {result && explanation && explanation.model_performance && (
        <Card>
          <CardHeader>
            <CardTitle>
              {explanation.model_performance_section_title ||
                "모델 성능"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 중요 지표 렌더링 */}
            <Typography variant="h6" style={{ color: '#8770b4', fontWeight: 'bold', paddingBottom: '10px' }}>
              ◾ 중요 지표
            </Typography>
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

            {/* 예측 모델 분석 렌더링 */}
            {explanation.model_performance.prediction_analysis && (
              <>
                <Typography
                  variant="h6"
                  className="mt-4"
                  style={{ color: '#8770b4', fontWeight: 'bold', paddingBottom: '10px' }}
                >
                  ◾ 예측 모델 분석
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

// PropTypes 정의 (유효성 검사)
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
      y_proba: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
        .isRequired,
      identifier: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
    graph3: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      classification_report: PropTypes.object.isRequired,
    }).isRequired,
    graph4: PropTypes.shape({
      graph_type: PropTypes.string.isRequired,
      confusion_matrix: PropTypes.arrayOf(
        PropTypes.arrayOf(PropTypes.number)
      ).isRequired,
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
        description: PropTypes.string,
        insights: PropTypes.string,
      })
    ).isRequired,
    model_specific_details: PropTypes.shape({
      details: PropTypes.shape({
        random_forest_case: PropTypes.shape({
          report_title: PropTypes.string,
          x_axis_title: PropTypes.string,
          x_axis_description: PropTypes.string,
          y_axis_title: PropTypes.string,
          y_axis_description: PropTypes.string,
        }),
      }),
    }),
    report_title: PropTypes.string,
    "x-axis_title": PropTypes.string,
    "x-axis_description": PropTypes.string,
    "y-axis_title": PropTypes.string,
    "y-axis_description": PropTypes.string,
    overview_section_title: PropTypes.string,
    model_performance_section_title: PropTypes.string,
    key_findings_section_title: PropTypes.string,
    recommendations_section_title: PropTypes.string,
  }).isRequired,
};
