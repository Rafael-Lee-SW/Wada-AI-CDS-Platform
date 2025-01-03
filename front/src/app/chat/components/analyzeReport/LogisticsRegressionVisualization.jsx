"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import * as d3 from "d3";

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
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../ui/table";
import { Button } from "../ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Typography } from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

import useLogisticRegressionStyles from "/styles/analyzingLogisticStyle.js";

export default function LogisticRegressionVisualization({
  result,
  explanation,
}) {
  const classes = useLogisticRegressionStyles();
  const [decisionBoundaryData, setDecisionBoundaryData] = useState(null);
  const [classificationReportData, setClassificationReportData] =
    useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [dataTable, setDataTable] = useState([]);
  const [boundaryLinesTitles, setBoundaryLinesTitles] = useState([]);
  const [error, setError] = useState(null);
  const [showInset, setShowInset] = useState(true);

  const {
    overview,
    model_performance,
    feature_importance,
    visualizations,
    key_findings,
    recommendations,
    model_specific_details = {},
    overview_section_title = "개요",
    key_findings_section_title = "주요 발견 사항",
    recommendations_section_title = "권장 사항",
    data_table_title = "모든 데이터 포인트",
    data_table_description = "모든 데이터 포인트의 상세 정보를 확인할 수 있습니다.",
  } = explanation || {};

  const logisticCase =
    model_specific_details?.details?.logistic_regression_case || {};

  const {
    report_title: logisticReportTitle = "AI 모델 분석 보고서",
    classes: logisticClasses = {},
    boundary_lines: logisticBoundaryLines = {},
  } = logisticCase;

  const xAxisTitle = logisticCase?.x_axis_title || explanation["x-axis_title"] || "PC1";
  const xAxisDescription =
    logisticCase?.x_axis_description ||
    explanation["x-axis_description"] ||
    "PC1은 데이터의 첫 번째 주성분으로, 주요 요인을 대표합니다.";
  const yAxisTitle = logisticCase?.y_axis_title || explanation["y-axis_title"] || "PC2";
  const yAxisDescription =
    logisticCase?.y_axis_description ||
    explanation["y-axis_description"] ||
    "PC2는 데이터의 두 번째 주성분으로, 첫번째 주성분간의 추가적인 변동성을 설명합니다.";

  const [activeTab, setActiveTab] = useState("decision_boundary");
  const [colorMapping, setColorMapping] = useState({});

  useEffect(() => {
    try {
      if (!result) {
        setError("시각화를 위한 데이터가 없습니다.");
        return;
      }

      const { graph1, graph3 } = result;

      if (graph1 && graph1.graph_type === "decision_boundary") {
        const { X_pca, y, coefficients, intercept, classes, original_data } =
          graph1;

        if (
          !X_pca ||
          !y ||
          !coefficients ||
          !intercept ||
          !classes ||
          X_pca.length === 0 ||
          y.length === 0
        ) {
          setError("결정 경계 시각화를 위한 데이터가 불완전합니다.");
        } else {
          const figure = createDecisionBoundaryPlot(
            X_pca,
            y,
            coefficients,
            intercept,
            classes,
            logisticBoundaryLines
          );
          setDecisionBoundaryData(figure);

          if (original_data && Array.isArray(original_data)) {
            setDataTable(
              original_data.map((dataPoint, index) => ({
                id: index,
                ...dataPoint,
                Predicted_Class: y[index],
              }))
            );
          } else {
            setDataTable(
              X_pca.map((point, index) => ({
                id: index,
                PC1: point[0].toFixed(2),
                PC2: point[1].toFixed(2),
                Predicted_Class: y[index],
              }))
            );
          }
        }
      } else {
        setError("결정 경계 시각화를 위한 데이터가 없습니다.");
      }

      if (graph3 && graph3.classification_report) {
        const report = graph3.classification_report;
        const { reportRows, overallAccuracy } =
          transformClassificationReport(report);
        setClassificationReportData(reportRows);
        setAccuracy(overallAccuracy);
      } else {
        setError("분류 보고서를 위한 데이터가 없습니다.");
      }

      if (
        logisticBoundaryLines.boundary_line_title &&
        logisticBoundaryLines.boundary_line_title.length > 0
      ) {
        setBoundaryLinesTitles(logisticBoundaryLines.boundary_line_title);
      }

      setError(null);
    } catch (e) {
      setError("시각화 데이터 처리에 실패했습니다.");
    }
  }, [result]);

  const createDecisionBoundaryPlot = (
    X_pca,
    y,
    coefficients,
    intercept,
    classes,
    boundaryLines
  ) => {
    const mappedY = y.map((cls) => {
      const isBinary =
        result.model === "LogisticRegressionBinary";
      const isMultinomial =
        result.model === "LogisticRegressionMultinomial";

      if (isBinary) {
        return logisticClasses.classTitle?.[cls] || `Class ${cls}`;
      } else if (isMultinomial) {
        return logisticClasses.classTitle?.[cls - 1] || `Class ${cls}`;
      } else {
        return logisticClasses.classTitle?.[cls] || `Class ${cls}`;
      }
    });

    const palette = d3.schemeCategory10;
    const uniqueClasses = [...new Set(mappedY)];
    const mapping = {};

    uniqueClasses.forEach((cls, idx) => {
      mapping[cls] = palette[idx % palette.length];
    });

    setColorMapping(mapping);

    const fig = {
      data: [],
      layout: {
        title: visualizations[0]?.title || "결정 경계 시각화",
        xaxis: {
          title: xAxisTitle || "주성분 1번 축",
          zeroline: false,
          showgrid: true,
          gridcolor: "#e5e5e5",
          tickfont: { size: 14 },
          titlefont: { size: 16, family: "Arial, sans-serif" },
        },
        yaxis: {
          title: yAxisTitle || "주성분 2번 축",
          zeroline: false,
          showgrid: true,
          gridcolor: "#e5e5e5",
          tickfont: { size: 14 },
          titlefont: { size: 16, family: "Arial, sans-serif" },
        },
        legend: {
          title: { text: "클래스" },
          orientation: "h",
          x: 0,
          y: -0.2,
          font: { size: 12 },
        },
        plot_bgcolor: "#f9f9f9",
        paper_bgcolor: "#f9f9f9",
        height: 600,
        margin: { t: 50, l: 50, r: 50, b: 100 },
        font: { family: "Arial, sans-serif", color: "#1D1D1F" },
        hovermode: "closest",
        annotations: [], 
      },
    };

    uniqueClasses.forEach((cls) => {
      const indices = mappedY.reduce((acc, val, idx) => {
        if (val === cls) acc.push(idx);
        return acc;
      }, []);

      fig.data.push({
        x: indices.map((idx) => X_pca[idx][0]),
        y: indices.map((idx) => X_pca[idx][1]),
        mode: "markers",
        type: "scatter",
        marker: {
          color: mapping[cls],
          size: 6,
          opacity: 0.8,
          line: { width: 1, color: "black" },
        },
        name: cls,
        hoverinfo: "text",
        text: indices.map(
          (idx) =>
            `클래스: ${cls}<br>PC1: ${X_pca[idx][0].toFixed(2)}<br>PC2: ${X_pca[
              idx
            ][1].toFixed(2)}`
        ),
      });
    });

    const xMin = d3.min(X_pca, (d) => d[0]) - 1;
    const xMax = d3.max(X_pca, (d) => d[0]) + 1;
    const xVals = d3.range(xMin, xMax, (xMax - xMin) / 200);

    const annotations = [];
    let boundaryIndex = 0; 

    if (classes.length === 2) {
      const w = coefficients[0]; 
      const b = intercept[0];
      if (w[1] !== 0) {
        const yVals = xVals.map((x) => (-b - w[0] * x) / w[1]);
        fig.data.push({
          x: xVals,
          y: yVals,
          mode: "lines",
          line: { color: "black", width: 2 },
          name: "결정 경계",
          showlegend: true,
        });
        annotations.push({
          x: (xMin + xMax) / 2,
          y: (-b - w[0] * ((xMin + xMax) / 2)) / w[1],
          xref: "x",
          yref: "y",
          text: "결정 경계",
          showarrow: false,
          font: { color: "black", size: 12 },
        });
      }
    } else {
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          const w_diff = [
            coefficients[i][0] - coefficients[j][0],
            coefficients[i][1] - coefficients[j][1],
          ];
          const b_diff = intercept[i] - intercept[j];
          if (w_diff[1] !== 0) {
            const yVals = xVals.map(
              (x) => (-b_diff - w_diff[0] * x) / w_diff[1]
            );
            fig.data.push({
              x: xVals,
              y: yVals,
              mode: "lines",
              line: { color: "gray", width: 2, dash: "dash" },
              name: `경계선 ${getClassName(classes[i])} vs ${getClassName(
                classes[j]
              )}`,
              showlegend: true, 
            });

            const midX = (xMin + xMax) / 2;
            const midY = (-b_diff - w_diff[0] * midX) / w_diff[1];

            const boundaryTitle =
              boundaryLinesTitles[boundaryIndex] ||
              `경계선 ${getClassName(classes[i])} vs ${getClassName(
                classes[j]
              )}`;

            annotations.push({
              x: midX,
              y: midY,
              xref: "x",
              yref: "y",
              text: boundaryTitle,
              showarrow: false,
              font: { color: "gray", size: 12 },
            });

            boundaryIndex++; 
          }
        }
      }
    }

    fig.layout.annotations = annotations;

    return fig;
  };

  const getClassName = (cls) => {
    return (
      logisticClasses.classTitle?.[cls] || `Class ${cls}`
    );
  };

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

  const renderClassificationReport = () => {
    if (!classificationReportData) return null;

    return (
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>클래스</TableHead>
              <TableHead>정밀도</TableHead>
              <TableHead>재현율</TableHead>
              <TableHead>F1-스코어</TableHead>
              <TableHead>지원</TableHead>
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
        <p className="mt-4">
          <strong>전체 정확도 (Accuracy):</strong> {accuracy !== null ? accuracy.toFixed(3) : "N/A"}
        </p>
      </div>
    );
  };

  const renderDataTable = () => {
    if (!dataTable.length) return null;

    const excludeColumns = ["id"];
    const dataKeys = Object.keys(dataTable[0]).filter(
      (key) => !excludeColumns.includes(key)
    );

    const columns = dataKeys.map((key) => ({
      field: key,
      headerName: key.replace("_", " "),
      flex: 1,
      minWidth: 150,
    }));

    const rows = dataTable.map((row) => ({ id: row.id, ...row }));

    return (
      <div className="overflow-auto">
        <Table>
          <TableCaption>모든 데이터 포인트의 상세 정보</TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.field}>{col.headerName}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.field}>
                    {col.field === "Predicted_Class" ? (
                      <span
                        className="inline-block w-4 h-4 mr-2 rounded-full"
                        style={{
                          backgroundColor:
                            colorMapping[row[col.field]] || "#000", // Default to black if undefined
                        }}
                        title={row[col.field]}
                      ></span>
                    ) : null}
                    {row[col.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      {error && (
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
      )}
      {!error && (
        <>
          <h1 className="text-4xl font-bold text-center mb-8">
            {logisticReportTitle || "AI 모델 분석 보고서"}
          </h1>
          <Card>
            <CardHeader>
              <CardTitle>
                {overview_section_title || "개요"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="h6" style={{ paddingBottom: '10px' }}>
                ◾ 분석 목적
              </Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.analysis_purpose ||
                  "분석 목적이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6" style={{ paddingBottom: '10px' }}>
                ◾ 데이터 설명
              </Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.data_description ||
                  "데이터 설명이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6" style={{ paddingBottom: '10px' }}>
                ◾ 사용된 모델
              </Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.models_used?.model_description ||
                  "모델 설명이 제공되지 않았습니다."}
              </Typography>
            </CardContent>
          </Card>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 w-full space-x-4">
              <TabsTrigger
                value="decision_boundary"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                결정 경계
              </TabsTrigger>
              <TabsTrigger
                value="classification_report"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                분류 보고서
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
            <TabsContent value="decision_boundary">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[0]?.title || "결정 경계 시각화"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[0]?.description ||
                      "PC1과 PC2의 분포를 통해 각 클래스 간 경계를 보여줍니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={classes.plotContainer}>
                    {decisionBoundaryData && (
                      <Plot
                        data={decisionBoundaryData.data}
                        layout={decisionBoundaryData.layout}
                        config={{ responsive: true }}
                      />
                    )}
                    {xAxisDescription && (
                      <Typography
                        variant="body2"
                        gutterBottom
                        className={classes.typographyBody2}
                      >
                        <strong>{`${xAxisTitle} (x)`}</strong>: {xAxisDescription}
                      </Typography>
                    )}
                    {yAxisDescription && (
                      <Typography
                        variant="body2"
                        gutterBottom
                        className={classes.typographyBody2}
                      >
                        <strong>{`${yAxisTitle} (y)`}</strong>: {yAxisDescription}
                      </Typography>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h3 className="text-lg font-semibold mb-2">
                        클래스 설명
                      </h3>
                      {logisticClasses.classTitle &&
                        logisticClasses.classDescription &&
                        logisticClasses.classTitle.map((title, index) => (
                          <Card key={index} className="flex items-center p-2" style={{ padding:'10px'}}>
                            <span
                              className="inline-block w-4 h-4 mr-2 rounded-full"
                              style={{
                                backgroundColor: colorMapping[title] || "#000", // Use class title as key
                              }}
                            ></span>
                            <div>
                              <CardTitle className="text-sm" style={{ textAlign: 'start', padding: '10px 0' }}>{title}</CardTitle>
                              <CardContent className="p-0" style={{ textAlign: 'start', padding: 0 }}>
                                <Typography variant="body2">
                                  {logisticClasses.classDescription[index] ||
                                    "설명이 제공되지 않았습니다."}
                                </Typography>
                              </CardContent>
                            </div>
                          </Card>
                        ))}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2" style={{ paddingBottom: '10px' }}>
                        결정 경계 설명
                      </h3>
                      {boundaryLinesTitles &&
                        boundaryLinesTitles.map((title, index) => (
                          <Card key={index} className="p-2 mb-2">
                            <CardHeader>
                              <CardTitle style={{ color: '#8770b4' }}>
                                {title || `경계선 ${index + 1}`}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Typography variant="body2">
                                {logisticBoundaryLines.boundary_line_description[index] ||
                                  "설명이 제공되지 않았습니다."}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="classification_report">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[1]?.title || "분류 보고서"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[1]?.description ||
                      "모델의 분류 성능을 보여줍니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {accuracy !== null && (
                    <div className="mb-4">
                      <Typography variant="h6">
                        전체 정확도 (Accuracy): {accuracy.toFixed(3)}
                      </Typography>
                    </div>
                  )}
                  {renderClassificationReport()}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="confusion_matrix">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[2]?.title || "혼동 행렬"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[2]?.description ||
                      "실제 값과 예측 값 간의 혼동 행렬을 나타냅니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent className={classes.plotContainer}>
                  {result.graph4 && (
                    <Plot
                      data={[
                        {
                          z: result.graph4.confusion_matrix,
                          x: result.graph4.labels,
                          y: result.graph4.labels,
                          type: "heatmap",
                          colorscale: "Blues",
                          hoverongaps: false,
                          text: result.graph4.confusion_matrix.map((row) =>
                            row.join(", ")
                          ),
                          texttemplate: "%{text}",
                          textfont: {
                            color: "white",
                          },
                        },
                      ]}
                      layout={{
                        title: visualizations[2]?.title || "혼동 행렬",
                        xaxis: {
                          title: xAxisTitle || "예측 값",
                          automargin: true,
                        },
                        yaxis: {
                          title: yAxisTitle || "실제 값",
                          automargin: true,
                        },
                        height: 600,
                        template: "plotly_white",
                      }}
                      config={{ responsive: true }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="classification_probabilities">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[3]?.title || "분류 확률"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[3]?.description ||
                      "각 멤버의 클래스에 대한 예측 확률을 나타냅니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent className={classes.plotContainer}>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="predictions_overview">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[4]?.title || "전체 예측 데이터"}
                  </CardTitle>
                  <CardDescription>
                    {visualizations[4]?.description ||
                      "모든 점들에 대한 실제 값, 예측 값, 잔차를 나타냅니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent className={classes.plotContainer}>
                  {renderDataTable()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <Card>
            <CardHeader>
              <CardTitle>
                {feature_importance?.key_features_title || "특성 중요도"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feature_importance?.key_features.map((feature, index) => (
                <Card key={index} className="mb-4 p-2">
                  <CardHeader className="flex items-center">
                    <span
                      className="inline-block w-4 h-4 mr-2 rounded-full"
                      style={{
                        backgroundColor: "#6b7280", 
                      }}
                    ></span>
                    <CardTitle className="text-sm">
                      {feature.feature_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Typography variant="body2" style={{ fontSize: '18px', fontWeight: 'bold', color: '#8770b4', paddingBottom: '10px'}}>
                      중요도 점수:{" "}
                      {feature.importance_score !== null
                        ? feature.importance_score
                        : "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>비즈니스 영향: </strong>{feature.business_impact}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              {feature_importance?.relationships.map((rel, index) => (
                <Card key={index} className="mb-4 p-2">
                  <CardHeader>
                    <CardTitle>관계 {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Typography variant="body2" style={{ paddingBottom: '10px'}}>
                      설명: {rel.description}
                    </Typography>
                    <Typography variant="body2">
                      비즈니스 인사이트: {rel.business_insight}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {key_findings_section_title || "주요 발견사항"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {key_findings.map((finding, index) => (
                  <li key={index} className={classes.listItem}>
                    <Typography variant="h6" style={{ color: '#8770b4', fontWeight: 'bold', paddingBottom: '10px' }}>
                      {finding.finding}
                    </Typography>
                    <Typography variant="body1" style={{ paddingBottom: '10px' }}>
                      <strong>{finding.impact_label || "영향"}:</strong>{" "}
                      {finding.impact}
                    </Typography>
                    <Typography variant="body1">
                      <strong>
                        {finding.recommendation_label || "권장 사항"}:
                      </strong>{" "}
                      ◾ {finding.recommendation}
                    </Typography>
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
              {recommendations.immediate_actions &&
                recommendations.immediate_actions.length > 0 && (
                  <>
                    <Typography variant="h6" className="mb-2" style={{ paddingBottom: '10px' }}>
                      {recommendations.immediate_actions_title ||
                        "즉각적인 조치"}
                    </Typography>
                    <ul className="list-disc pl-5 space-y-2">
                      {recommendations.immediate_actions.map(
                        (action, index) => (
                          <li key={index}>{action}</li>
                        )
                      )}
                    </ul>
                  </>
                )}
              {recommendations.further_analysis &&
                recommendations.further_analysis.length > 0 && (
                  <>
                    <Typography variant="h6" className="mt-4 mb-2" style={{ paddingBottom: '10px', paddingTop: '10px' }}>
                      {recommendations.further_analysis_title || "추가 분석"}
                    </Typography>
                    <ul className="list-disc pl-5 space-y-2">
                      {recommendations.further_analysis.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </>
                )}
            </CardContent>
          </Card>
          {model_performance.metrics &&
            model_performance.metrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {explanation.model_performance_section_title || "모델 성능"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {model_performance.metrics.map((metric, index) => (
                    <div key={index} className="mb-2">
                      <Typography variant="body1">
                        <strong>{metric.metric_name}:</strong>{" "}
                        {metric.metric_value}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {metric.interpretation}
                      </Typography>
                    </div>
                  ))}
                  {model_performance.prediction_analysis && (
                    <>
                      <Typography variant="h6" className="mt-4" style={{ paddingTop: '10px', paddingBottom: '10px', color: '#8770b4', fontWeight: 'bold' }}>
                        ◾ 예측 분석
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>전체 정확도:</strong>{" "}
                        {model_performance.prediction_analysis.overall_accuracy}
                      </Typography>
                      <Typography variant="body1" style={{ paddingBottom: '10px' }}>
                        <strong>주목할 만한 패턴:</strong>
                      </Typography>
                      <ul className="list-disc pl-5">
                        {model_performance.prediction_analysis.notable_patterns.map(
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
        </>
      )}
    </div>
  );
}

LogisticRegressionVisualization.propTypes = {
  result: PropTypes.shape({
    graph1: PropTypes.shape({
      graph_type: PropTypes.string,
      X_pca: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
      y: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ), // Handle both strings and numbers
      coefficients: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
      intercept: PropTypes.arrayOf(PropTypes.number),
      classes: PropTypes.arrayOf(PropTypes.string), 
      original_data: PropTypes.arrayOf(PropTypes.object), 
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
          metric_value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
          ]),
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
          importance_score: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
          ]),
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
    model_specific_details: PropTypes.shape({
      details: PropTypes.shape({
        logistic_regression_case: PropTypes.shape({
          report_title: PropTypes.string,
          classes: PropTypes.shape({
            classTitle: PropTypes.arrayOf(PropTypes.string),
            classDescription: PropTypes.arrayOf(PropTypes.string),
          }),
          boundary_lines: PropTypes.shape({
            boundary_line_title: PropTypes.arrayOf(PropTypes.string),
            boundary_line_description: PropTypes.arrayOf(PropTypes.string),
          }),
          x_axis_title: PropTypes.string,
          x_axis_description: PropTypes.string,
          y_axis_title: PropTypes.string,
          y_axis_description: PropTypes.string,
        }),
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
    data_table_description: PropTypes.string, 
  }).isRequired,
};
