"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import * as d3 from "d3";

// UI Components from your template
import { Slider } from "../ui/silder"; // Corrected import from "silder" to "slider"
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

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Custom Styles
import useLogisticRegressionStyles from "/styles/analyzingLogisticStyle.js";

export default function LogisticRegressionVisualization({
  result,
  explanation,
}) {
  const classes = useLogisticRegressionStyles();

  // State variables
  const [decisionBoundaryData, setDecisionBoundaryData] = useState(null);
  const [classificationReportData, setClassificationReportData] =
    useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [dataTable, setDataTable] = useState([]);
  const [boundaryLinesTitles, setBoundaryLinesTitles] = useState([]);
  const [error, setError] = useState(null);
  const [showInset, setShowInset] = useState(true);

  // Extract explanations
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
    LogisticRegression_Case?.report_title || "AI 모델 분석 보고서";
  const classesInfo = LogisticRegression_Case?.classes || {};
  const boundaryLines = LogisticRegression_Case?.boundary_lines || {};
  const xAxisTitle = explanation["x-axis_title"] || "PC1";
  const xAxisDescription =
    explanation["x-axis_description"] ||
    "PC1은 데이터의 첫 번째 주성분으로, 주요 요인을 대표합니다.";
  const yAxisTitle = explanation["y-axis_title"] || "PC2";
  const yAxisDescription =
    explanation["y-axis_description"] ||
    "PC2는 데이터의 두 번째 주성분으로, 첫번째 주성분간의 추가적인 변동성을 설명합니다.";

  // State to control active tab
  const [activeTab, setActiveTab] = useState("decision_boundary");

  // Color mapping for classes
  const [colorMapping, setColorMapping] = useState({});

  // Process the result prop to extract necessary data
  useEffect(() => {
    try {
      if (!result) {
        setError("시각화를 위한 데이터가 없습니다.");
        return;
      }

      const { graph1, graph3 } = result;

      // --- Decision Boundary Plot ---
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
            boundaryLines
          );
          setDecisionBoundaryData(figure);

          // Prepare data table if original data is available
          if (original_data && Array.isArray(original_data)) {
            setDataTable(
              original_data.map((dataPoint, index) => ({
                id: index,
                ...dataPoint,
                Predicted_Class: y[index],
              }))
            );
          } else {
            // If original data is not available, create a basic table
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

      // --- Classification Report ---
      if (graph3 && graph3.classification_report) {
        const report = graph3.classification_report;
        const { reportRows, overallAccuracy } =
          transformClassificationReport(report);
        setClassificationReportData(reportRows);
        setAccuracy(overallAccuracy);
      } else {
        setError("분류 보고서를 위한 데이터가 없습니다.");
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
      console.error("시각화 데이터 처리 중 오류 발생:", e);
      setError("시각화 데이터 처리에 실패했습니다.");
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
    // Handle y being either class indices (numbers) or class titles (strings)
    // Map y indices to class titles
    const mappedY = y.map((cls) => {
      // Check the model type and adjust mapping logic accordingly
      if (overview.models_used.model_name === "LogisticRegressionBinary") {
        // Use 'cls' directly for binary classification
        return classesInfo.classTitle[cls] || `Class ${cls}`;
      } else if (
        overview.models_used.model_name === "LogisticRegressionMultinomial"
      ) {
        // Adjust for multinomial classification
        return classesInfo.classTitle[cls - 1] || `Class ${cls - 1}`;
      } else {
        // Default handling for other models
        return `Unknown Class (${cls})`;
      }
    });

    // Define color palette
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
          title: { text: "계층" },
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
        annotations: [], // To hold boundary line titles
      },
    };

    // Add scatter plot for each class
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

    // Compute and plot decision boundaries
    const xMin = d3.min(X_pca, (d) => d[0]) - 1;
    const xMax = d3.max(X_pca, (d) => d[0]) + 1;
    const xVals = d3.range(xMin, xMax, (xMax - xMin) / 200);

    const annotations = [];
    let boundaryIndex = 0; // Initialize boundary line index

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
          name: "결정 경계",
          showlegend: true, // Ensure legend is shown
        });
        // Add annotation for the boundary line
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
      // Multiclass classification
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
              showlegend: true, // Ensure legend is shown
            });

            // Calculate midpoint for annotation
            const midX = (xMin + xMax) / 2;
            const midY = (-b_diff - w_diff[0] * midX) / w_diff[1];

            // Retrieve the corresponding boundary line title
            const boundaryTitle =
              boundaryLines.boundary_line_title?.[boundaryIndex] ||
              `경계선 ${getClassName(classes[i])} vs ${getClassName(
                classes[j]
              )}`;

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

            boundaryIndex++; // Increment boundary line index
          }
        }
      }
    }

    fig.layout.annotations = annotations;

    return fig;
  };

  // Helper function to get class name based on class label
  const getClassName = (cls) => {
    // Use class index to get the title
    return (
      LogisticRegression_Case?.classes?.classTitle?.[cls] || `Class ${cls}`
    );
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

  // Render Classification Report as a table
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
      </div>
    );
  };

  // Render Data Table for All Spots
  const renderDataTable = () => {
    if (!dataTable.length) return null;

    // Dynamically generate columns based on data keys, excluding 'id' if necessary
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

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
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
          <h1 className="text-4xl font-bold text-center mb-8">
            {reportTitle || "AI 모델 분석 보고서"}
          </h1>

          {/* Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {explanation.overview_section_title || "개요"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="h6">분석 목적</Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.analysis_purpose ||
                  "분석 목적이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6">데이터 설명</Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.data_description ||
                  "데이터 설명이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6">사용된 모델</Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.models_used?.model_description ||
                  "모델 설명이 제공되지 않았습니다."}
              </Typography>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="decision_boundary">결정 경계</TabsTrigger>
              <TabsTrigger value="classification_report">
                분류 보고서
              </TabsTrigger>
              <TabsTrigger value="data_table">데이터 테이블</TabsTrigger>
            </TabsList>

            {/* Decision Boundary Tab Content */}
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
                  {/* Class Descriptions and Boundary Lines Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Class Descriptions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        클래스 설명
                      </h3>
                      {classesInfo.classTitle &&
                        classesInfo.classDescription &&
                        classesInfo.classTitle.map((title, index) => (
                          <Card key={index} className="flex items-center p-2">
                            <span
                              className="inline-block w-4 h-4 mr-2 rounded-full"
                              style={{
                                backgroundColor: colorMapping[title] || "#000", // Use class title as key
                              }}
                            ></span>
                            <div>
                              <CardTitle className="text-sm">{title}</CardTitle>
                              <CardContent className="p-0">
                                <Typography variant="body2">
                                  {classesInfo.classDescription[index] ||
                                    "설명이 제공되지 않았습니다."}
                                </Typography>
                              </CardContent>
                            </div>
                          </Card>
                        ))}
                    </div>
                    {/* Boundary Lines Descriptions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        결정 경계 설명
                      </h3>
                      {boundaryLines.boundary_line_description &&
                        boundaryLines.boundary_line_description.map(
                          (desc, index) => (
                            <Card key={index} className="p-2">
                              <CardHeader>
                                <CardTitle>
                                  {boundaryLines.boundary_line_title[index] ||
                                    `경계선 ${index + 1}`}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Typography variant="body2">{desc}</Typography>
                              </CardContent>
                            </Card>
                          )
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Classification Report Tab Content */}
            <TabsContent value="classification_report">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizations[0]?.description || "분류 보고서"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Display Overall Accuracy */}
                  {accuracy !== null && (
                    <div className="mb-4">
                      <Typography variant="h6">
                        전체 정확도: {accuracy.toFixed(4)}
                      </Typography>
                    </div>
                  )}
                  {/* Render Classification Report Table */}
                  {renderClassificationReport()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Table Tab Content */}
            <TabsContent value="data_table">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {explanation.data_table_title || "모든 데이터 포인트"}
                  </CardTitle>
                  <CardDescription>
                    {explanation.data_table_description ||
                      "모든 데이터 포인트의 상세 정보를 확인할 수 있습니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">{renderDataTable()}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Feature Importance */}
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
                        backgroundColor: "#6b7280", // Neutral color for feature name
                      }}
                    ></span>
                    <CardTitle className="text-sm">
                      {feature.feature_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Typography variant="body2">
                      중요도 점수:{" "}
                      {feature.importance_score !== null
                        ? feature.importance_score
                        : "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      비즈니스 영향: {feature.business_impact}
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
                    <Typography variant="body2">
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

          {/* Key Findings */}
          <Card>
            <CardHeader>
              <CardTitle>
                {explanation.key_findings_section_title || "주요 발견사항"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {key_findings.map((finding, index) => (
                  <li key={index} className={classes.listItem}>
                    <Typography variant="h6">{finding.finding}</Typography>
                    <Typography variant="body1">
                      <strong>{finding.impact_label || "영향"}:</strong>{" "}
                      {finding.impact}
                    </Typography>
                    <Typography variant="body1">
                      <strong>
                        {finding.recommendation_label || "권장 사항"}:
                      </strong>{" "}
                      {finding.recommendation}
                    </Typography>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>
                {explanation.recommendations_section_title || "권장 사항"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.immediate_actions &&
                recommendations.immediate_actions.length > 0 && (
                  <>
                    <Typography variant="h6" className="mb-2">
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
                    <Typography variant="h6" className="mt-4 mb-2">
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

          {/* Model Performance Section */}
          {model_performance.metrics &&
            model_performance.metrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {explanation.model_performance_section_title || "모델 성능"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Render Metrics */}
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

                  {/* Render Prediction Analysis */}
                  {model_performance.prediction_analysis && (
                    <>
                      <Typography variant="h6" className="mt-4">
                        예측 분석
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>전체 정확도:</strong>{" "}
                        {model_performance.prediction_analysis.overall_accuracy}
                      </Typography>
                      <Typography variant="body1">
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

// Define PropTypes for type checking
LogisticRegressionVisualization.propTypes = {
  result: PropTypes.shape({
    graph1: PropTypes.shape({
      graph_type: PropTypes.string,
      X_pca: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
      y: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ), // Changed to handle both strings and numbers
      coefficients: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
      intercept: PropTypes.arrayOf(PropTypes.number),
      classes: PropTypes.arrayOf(PropTypes.string), // Changed to string for class titles
      original_data: PropTypes.arrayOf(PropTypes.object), // Added for data table
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
    data_table_description: PropTypes.string, // Added for data table description
  }).isRequired,
};
