"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import * as d3 from "d3";
import convexHull from "convex-hull";
import { PCA } from "ml-pca";

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
import { Eye, EyeOff } from "lucide-react";
import { DataGrid } from "@mui/x-data-grid";
import { Typography } from "@mui/material";
import useAnalyzingKmeansStyles from "/styles/analyzingKmeansStyle.js";
import { purple } from "@mui/material/colors";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function KMeansVisualization({ result, explanation }) {
  const classes = useAnalyzingKmeansStyles();

  const featureColumns = Array.isArray(result.feature_columns_used)
    ? result.feature_columns_used
    : [];

  const modelType = (result.model || "").toLowerCase();
  const isAnomalyDetection = modelType.includes("anomalydetection");

  const [clusters, setClusters] = useState([]);
  const [clusterColorMap, setClusterColorMap] = useState({});
  const [clusterData, setClusterData] = useState([]);
  const [clusterSizes, setClusterSizes] = useState({});
  const [clusterCentersPca, setClusterCentersPca] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [numAnomalies, setNumAnomalies] = useState(2);
  const [error, setError] = useState(null);
  const [showInset, setShowInset] = useState(true);
  const { overview, key_findings, recommendations, visualizations } = explanation;
  const keyFindings = key_findings || [];
  const recommendationActions = recommendations || {};
  const visualizationsInfo = visualizations || [];
  const clusterInfo = explanation.model_specific_details?.details?.kmeans_clustering_case?.cluster || {};
  const kmeansCase = explanation.model_specific_details?.details?.kmeans_clustering_case || {};

  const {
    report_title: reportTitle = "AI 모델 분석 보고서",
    x_axis_title: xAxisTitle = "X 축",
    x_axis_description: xAxisDescription = "데이터의 첫 번째 주 성분에 기반한 축",
    y_axis_title: yAxisTitle = "Y 축",
    y_axis_description: yAxisDescription = "데이터의 두 번째 주 성분에 기반한 축",
    cluster_title: clusterGroupTitle = "설명",
    cluster_description: clusterGroupDescription = "각 클러스터는 유사한 특성을 가진 직원들로 구성되어 있습니다.",
    cluster: {
      cluster_title: clusterTitles = [],
      cluster_description: clusterDescriptions = [],
    } = {},
  } = kmeansCase;

  const [activeTab, setActiveTab] = useState(
    isAnomalyDetection ? "anomalies" : "clusters_graph"
  );

  useEffect(() => {
    setActiveTab(isAnomalyDetection ? "anomalies" : "clusters_graph");
  }, [isAnomalyDetection]);

  const generateClusterColorMap = (clusters, colors) => {
    const map = {};
    clusters.forEach((cluster, i) => {
      map[cluster] = colors[i % colors.length];
    });
    return map;
  };

  useEffect(() => {
    if (result) {
      processData();
    }
  }, [result, numAnomalies]);

  const processData = () => {
    try {
      const clusterLabel = result.cluster_label || "Cluster_Anomaly";
      const clusteredDataSample = result.graph4?.clustered_data_sample || {};
      const scalerMean = result.scaler_mean || [];
      const scalerScale = result.scaler_scale || [];
      const clusterCenters = result.cluster_centers || [];

      const dfSample = [];
      const sampleKeys = Object.keys(clusteredDataSample).filter(
        (key) => key !== clusterLabel
      );
      const numSamples = clusteredDataSample[sampleKeys[0]]?.length || 0;

      for (let i = 0; i < numSamples; i++) {
        const row = {};
        sampleKeys.forEach((key) => {
          row[key] = clusteredDataSample[key][i];
        });
        row[clusterLabel] = clusteredDataSample[clusterLabel][i];
        dfSample.push(row);
      }

      if (!dfSample.length) {
        setError("시각화를 위한 데이터가 없습니다.");
        return;
      }

      const X = dfSample.map((row) =>
        featureColumns.map((col) => row[col])
      );

      if (X.length === 0 || X[0].length === 0) {
        setError("데이터가 비어 있거나 형식이 잘못되었습니다.");
        return;
      }

      const X_scaled = X.map((row) =>
        row.map((value, i) => (value - scalerMean[i]) / scalerScale[i])
      );

      const hasInvalidValues = X_scaled.some((row) =>
        row.some((value) => isNaN(value) || value === undefined)
      );
      if (hasInvalidValues) {
        setError("스케일링 후 데이터에 유효하지 않은 값이 포함되어 있습니다.");
        return;
      }

      const pca = new PCA(X_scaled);
      const X_pca_matrix = pca.predict(X_scaled, { nComponents: 2 });
      const X_pca = X_pca_matrix.to2DArray();

      const centers_pca_matrix = pca.predict(clusterCenters, {
        nComponents: 2,
      });
      const centers_pca = centers_pca_matrix.to2DArray();

      const dfSampleWithPca = dfSample.map((row, index) => ({
        ...row,
        PC1: X_pca[index][0],
        PC2: X_pca[index][1],
      }));

      const sizes = {};
      dfSampleWithPca.forEach((row) => {
        const cluster = row[clusterLabel];
        sizes[cluster] = (sizes[cluster] || 0) + 1;
      });

      const clustersList = [
        ...new Set(dfSampleWithPca.map((d) => d[clusterLabel])),
      ];
      setClusters(clustersList);

      const colors = d3.schemeSet2;
      const newClusterColorMap = generateClusterColorMap(clustersList, colors);
      setClusterColorMap(newClusterColorMap);

      setClusterData(dfSampleWithPca);
      setClusterSizes(sizes);
      setClusterCentersPca(centers_pca);

      if (isAnomalyDetection) {
        const anomaliesData = computeAnomalies(
          dfSampleWithPca,
          centers_pca,
          clusterLabel,
          numAnomalies
        );
        setAnomalies(anomaliesData);
      } else {
        setAnomalies([]); 
      }

      setError(null);
    } catch (e) {
      setError("데이터 시각화 처리가 실패했습니다.");
    }
  };

  const computeAnomalies = (data, centers_pca, clusterLabel, numAnomalies) => {
    const anomalies = [];
    const clusters = {};

    data.forEach((row) => {
      const cluster = row[clusterLabel];
      if (!clusters[cluster]) clusters[cluster] = [];
      clusters[cluster].push(row);
    });

    Object.keys(clusters).forEach((cluster) => {
      const clusterIndex = parseInt(cluster, 10);
      const center = centers_pca[clusterIndex];
      if (!center) return;

      const points = clusters[cluster].map((row) => ({
        ...row,
        distance: Math.sqrt(
          Math.pow(row.PC1 - center[0], 2) + Math.pow(row.PC2 - center[1], 2)
        ),
      }));

      points.sort((a, b) => b.distance - a.distance);
      const topAnomalies = points.slice(0, numAnomalies);
      anomalies.push(...topAnomalies);
    });

    return anomalies;
  };

  const handleNumAnomaliesChange = (value) => {
    setNumAnomalies(value[0]);
  };

  const renderClusterDistribution = () => {
    const clusterLabels = clusters.map((cluster, index) => {
      return clusterTitles[index] || `클러스터 ${cluster}`;
    });
    const clusterCounts = clusters.map((cluster) => clusterSizes[cluster]);

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={[
            {
              x: clusterLabels,
              y: clusterCounts,
              type: "bar",
              marker: { color: "rgba(55,128,191,0.7)" },
              hoverinfo: "y",
            },
          ]}
          layout={{
            title: visualizationsInfo[0]?.title || "클러스터별 수",
            xaxis: {
              title:
                xAxisTitle ||
                (isAnomalyDetection ? "클러스터" : "클러스터 그래프"),
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
            },
            yaxis: {
              title: visualizationsInfo[0]?.yaxis_title || "구성 수",
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
            },
            plot_bgcolor: "#f9f9f9",
            paper_bgcolor: "#f9f9f9",
            autosize: true, 
            height: 400,
            margin: { t: 50, l: 50, r: 50, b: 80 }, 
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: "#1D1D1F",
            },
          }}
          config={{ responsive: true }}
        />
        <div className={classes.axisDescriptions}>
          {xAxisTitle && xAxisDescription && (
            <Typography
              variant="body2"
              gutterBottom
              className={classes.axisDescription}
            >
              <strong>{`${xAxisTitle} (x)`}</strong>: {xAxisDescription}
            </Typography>
          )}
          {yAxisTitle && yAxisDescription && (
            <Typography
              variant="body2"
              gutterBottom
              className={classes.axisDescription}
            >
              <strong>{`${yAxisTitle} (y)`}</strong>: {yAxisDescription}
            </Typography>
          )}
        </div>
      </div>
    );
  };

  const renderClusterInformation = () => {
    if (!clusters.length) return null;

    return (
      <Card className={classes.clusterInfoCard}>
        <CardHeader>
          <CardTitle>클러스터 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clusters.map((cluster, index) => (
              <div key={cluster} className={classes.clusterInfo}>
                <div
                  className="inline-block w-4 h-4 mr-2 rounded-full"
                  style={{ backgroundColor: clusterColorMap[cluster] }}
                ></div>
                <Typography
                  variant="h6"
                  className={classes.clusterTitle}
                  style={{ color: clusterColorMap[cluster] }}
                >
                  {clusterTitles[index] || `클러스터 ${cluster}`}:&nbsp;
                </Typography>
                <Typography
                  variant="body2"
                  className={classes.clusterDescription}
                >
                  {clusterDescriptions[index] || "설명 없음."}
                </Typography>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderClusterScatterPlot = () => {
    if (!clusterData.length) return null;

    const clusterLabel = result.cluster_label || "Cluster_Anomaly";
    const uniqueClusters = [
      ...new Set(clusterData.map((d) => d[clusterLabel])),
    ];

    const colors = d3.schemeSet2; 
    const currentClusterColorMap = generateClusterColorMap(
      uniqueClusters,
      colors
    );

    const data = [];

    uniqueClusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      const points = clusterPoints.map((d) => [d.PC1, d.PC2]);

      if (points.length >= 3) {
        const hullIndices = convexHull(points);
        const hullPoints = hullIndices.map(
          (indexPair) => points[indexPair[0]]
        );

        const clusterIndex = parseInt(cluster, 10);
        const centroid = clusterCentersPca[clusterIndex];
        if (!centroid) return;

        const expandedHullPoints = hullPoints.map(([x, y]) => {
          const dx = x - centroid[0];
          const dy = y - centroid[1];
          return [centroid[0] + dx * 1.1, centroid[1] + dy * 1.1];
        });
        const x = expandedHullPoints.map((p) => p[0]);
        const y = expandedHullPoints.map((p) => p[1]);

        data.push({
          x: [...x, x[0]],
          y: [...y, y[0]],
          mode: "lines",
          fill: "toself",
          fillcolor: currentClusterColorMap[cluster],
          opacity: 0.2,
          line: { color: currentClusterColorMap[cluster] },
          name: `${clusterTitles[i] || `클러스터 ${cluster}`} 영역`,
          hoverinfo: "text",
          text: clusterTitles[i] || `클러스터 ${cluster}`,
          hoveron: "fills",
        });
      }
    });

    uniqueClusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      data.push({
        x: clusterPoints.map((d) => d.PC1),
        y: clusterPoints.map((d) => d.PC2),
        mode: "markers",
        type: "scatter",
        name: clusterTitles[i] || `클러스터 ${cluster}`,
        marker: {
          color: currentClusterColorMap[cluster],
          size: 6,
          opacity: 0.8,
        },
        text: clusterPoints.map((d) => {
          const featureInfo = featureColumns
            .map((col) => `${col}: ${d[col]}`)
            .join("<br>");
          return `${featureInfo}<br>PC1: ${d.PC1.toFixed(
            2
          )}<br>PC2: ${d.PC2.toFixed(2)}`;
        }),
        hoverinfo: "text",
        hoverlabel: {
          bgcolor: "#FFFFFF",
          bordercolor: "#CCCCCC",
        },
      });
    });

    if (isAnomalyDetection && anomalies.length > 0) {
      data.push({
        x: anomalies.map((a) => a.PC1),
        y: anomalies.map((a) => a.PC2),
        mode: "markers",
        type: "scatter",
        name: "이상치",
        marker: { color: "red", symbol: "x", size: 12 },
        hoverinfo: "text",
        text: anomalies.map((a) => {
          const featureInfo = featureColumns
            .map((col) => `${col}: ${a[col]}`)
            .join("<br>");
          const clusterName =
            clusterTitles[a[clusterLabel]] || a[clusterLabel];
          return `${featureInfo}<br>PC1: ${a.PC1.toFixed(
            2
          )}<br>PC2: ${a.PC2.toFixed(2)}<br>클러스터: ${clusterName}`;
        }),
      });

      anomalies.forEach((anomaly) => {
        const cluster = anomaly[clusterLabel];
        const clusterIndex = parseInt(cluster, 10);
        const center = clusterCentersPca[clusterIndex];
        if (center) {
          data.push({
            x: [anomaly.PC1, center[0]],
            y: [anomaly.PC2, center[1]],
            mode: "lines",
            line: { color: "gray", dash: "dash" },
            showlegend: false,
          });
        }
      });
    }

    if (!isAnomalyDetection) {
      data.push({
        x: clusterCentersPca.map((c) => c[0]),
        y: clusterCentersPca.map((c) => c[1]),
        mode: "markers",
        type: "scatter",
        name: "클러스터 중심",
        marker: { color: "black", symbol: "diamond", size: 12 },
        hoverinfo: "none",
      });
    }

    if (showInset) {
      const clusterLabels = uniqueClusters.map((cluster) => {
        return clusterTitles[parseInt(cluster, 10)] || `클러스터 ${cluster}`;
      });
      const clusterCounts = uniqueClusters.map(
        (cluster) => clusterSizes[cluster]
      );

      data.push({
        x: clusterLabels,
        y: clusterCounts,
        type: "bar",
        marker: {
          color: uniqueClusters.map(
            (cluster) => currentClusterColorMap[cluster]
          ),
        },
        hoverinfo: "y",
        name: "클러스터 분포",
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      });
    }

    return (
      <div className={classes.plotContainer} style={{ position: "relative" }}>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={() => setShowInset(!showInset)}
        >
          {showInset ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Plot
          data={data}
          layout={{
            title: visualizationsInfo[1]?.title || "클러스터 산점도",
            xaxis: {
              title: xAxisTitle || "X 축",
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
              zeroline: false,
              showgrid: true,
              gridcolor: "#e5e5e5",
              linecolor: "#D1D1D6",
            },
            yaxis: {
              title: yAxisTitle || "Y 축",
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
              zeroline: false,
              showgrid: true,
              gridcolor: "#e5e5e5",
              linecolor: "#D1D1D6",
            },
            xaxis2: {
              domain: [0.7, 0.95],
              anchor: "y2",
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            yaxis2: {
              domain: [0.7, 0.95],
              anchor: "x2",
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            showlegend: false,
            legend: {
              title: { text: clusterGroupTitle || "설명" },
              orientation: "h",
              x: 0,
              y: -0.2,
              font: { size: 12 },
            },
            plot_bgcolor: "#f9f9f9",
            paper_bgcolor: "#f9f9f9",
            height: 600,
            margin: { t: 50, l: 50, r: 50, b: 100 },
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: "#1D1D1F",
            },
            hovermode: "closest",
            autosize: true,
          }}
          config={{ responsive: true }}
        />
        {xAxisTitle && xAxisDescription && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.typographyBody2}
          >
            <strong>{`${xAxisTitle} (x)`}</strong>: {xAxisDescription}
          </Typography>
        )}
        {yAxisTitle && yAxisDescription && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.typographyBody2}
          >
            <strong>{`${yAxisTitle} (y)`}</strong>: {yAxisDescription}
          </Typography>
        )}
        {clusterGroupDescription && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.typographyBody2}
          >
            {clusterGroupDescription}
          </Typography>
        )}
      </div>
    );
  };

  const renderClusteredDataTable = () => {
    if (!clusterData.length) return null;

    const excludeColumns = ["Cluster_Anomaly"]; 
    const dataKeys = Object.keys(clusterData[0]).filter(
      (key) => !excludeColumns.includes(key)
    );

    const columns = dataKeys.map((key) => ({
      field: key,
      headerName: key,
      flex: 1,
      minWidth: 150,
    }));

    excludeColumns.forEach((key) => {
      columns.push({
        field: key,
        headerName: key.replace("_", " "),
        flex: 1,
        minWidth: 100,
        type: "number",
      });
    });

    const rows = clusterData.map((row, index) => ({ id: index, ...row }));

    return (
      <div style={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20, 50, 100]}
          checkboxSelection
          disableSelectionOnClick
          className={classes.dataGrid}
        />
      </div>
    );
  };

  const renderAnomalyScatterPlot = () => {
    if (!clusterData.length || !isAnomalyDetection) return null;

    const clusterLabel = result.cluster_label || "Cluster_Anomaly";
    const uniqueClusters = [
      ...new Set(clusterData.map((d) => d[clusterLabel])),
    ];

    const colors = d3.schemeSet2;

    const currentClusterColorMap = generateClusterColorMap(
      uniqueClusters,
      colors
    );

    const data = [];

    uniqueClusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      const points = clusterPoints.map((d) => [d.PC1, d.PC2]);

      if (points.length >= 3) {
        const hullIndices = convexHull(points);
        const hullPoints = hullIndices.map((indexPair) => points[indexPair[0]]);

        const clusterIndex = parseInt(cluster, 10);
        const centroid = clusterCentersPca[clusterIndex];
        if (!centroid) return;

        const expandedHullPoints = hullPoints.map(([x, y]) => {
          const dx = x - centroid[0];
          const dy = y - centroid[1];
          return [centroid[0] + dx * 1.1, centroid[1] + dy * 1.1];
        });
        const x = expandedHullPoints.map((p) => p[0]);
        const y = expandedHullPoints.map((p) => p[1]);

        data.push({
          x: [...x, x[0]],
          y: [...y, y[0]],
          mode: "lines",
          fill: "toself",
          fillcolor: currentClusterColorMap[cluster],
          opacity: 0.2,
          line: { color: currentClusterColorMap[cluster] },
          name: `${clusterTitles[i] || `클러스터 ${cluster}`} 영역`,
          hoverinfo: "text",
          text: clusterTitles[i] || `클러스터 ${cluster}`,
          hoveron: "fills",
        });
      }
    });

    uniqueClusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      data.push({
        x: clusterPoints.map((d) => d.PC1),
        y: clusterPoints.map((d) => d.PC2),
        mode: "markers",
        type: "scatter",
        name: clusterTitles[i] || `클러스터 ${cluster}`,
        marker: {
          color: currentClusterColorMap[cluster],
          size: 6,
          opacity: 0.8,
        },
        text: clusterPoints.map((d) => {
          const featureInfo = featureColumns
            .map((col) => `${col}: ${d[col]}`)
            .join("<br>");
          return `${featureInfo}<br>PC1: ${d.PC1.toFixed(
            2
          )}<br>PC2: ${d.PC2.toFixed(2)}`;
        }),
        hoverinfo: "text",
        hoverlabel: {
          bgcolor: "#FFFFFF",
          bordercolor: "#CCCCCC",
        },
      });
    });

    data.push({
      x: anomalies.map((a) => a.PC1),
      y: anomalies.map((a) => a.PC2),
      mode: "markers",
      type: "scatter",
      name: "이상치",
      marker: { color: "red", symbol: "x", size: 12 },
      hoverinfo: "text",
      text: anomalies.map((a) => {
        const featureInfo = featureColumns
          .map((col) => `${col}: ${a[col]}`)
          .join("<br>");
        const clusterName = clusterTitles[a[clusterLabel]] || a[clusterLabel];
        return `${featureInfo}<br>PC1: ${a.PC1.toFixed(
          2
        )}<br>PC2: ${a.PC2.toFixed(2)}<br>클러스터: ${clusterName}`;
      }),
    });

    anomalies.forEach((anomaly) => {
      const cluster = anomaly[clusterLabel];
      const clusterIndex = parseInt(cluster, 10);
      const center = clusterCentersPca[clusterIndex];
      if (center) {
        data.push({
          x: [anomaly.PC1, center[0]],
          y: [anomaly.PC2, center[1]],
          mode: "lines",
          line: { color: "gray", dash: "dash" },
          showlegend: false,
        });
      }
    });

    if (!isAnomalyDetection) {
      data.push({
        x: clusterCentersPca.map((c) => c[0]),
        y: clusterCentersPca.map((c) => c[1]),
        mode: "markers",
        type: "scatter",
        name: "클러스터 중심",
        marker: { color: "black", symbol: "diamond", size: 12 },
        hoverinfo: "none",
      });
    }

    if (showInset) {
      const clusterLabels = uniqueClusters.map((cluster) => {
        return clusterTitles[parseInt(cluster, 10)] || `클러스터 ${cluster}`;
      });
      const clusterCounts = uniqueClusters.map(
        (cluster) => clusterSizes[cluster]
      );

      data.push({
        x: clusterLabels,
        y: clusterCounts,
        type: "bar",
        marker: {
          color: uniqueClusters.map(
            (cluster) => currentClusterColorMap[cluster]
          ),
        },
        hoverinfo: "y",
        name: "클러스터 분포",
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      });
    }

    return (
      <div className={classes.plotContainer} style={{ position: "relative" }}>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={() => setShowInset(!showInset)}
        >
          {showInset ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Plot
          data={data}
          layout={{
            title: visualizationsInfo[1]?.title || "클러스터 산점도",
            xaxis: {
              title: xAxisTitle || "X 축",
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
              zeroline: false,
              showgrid: true,
              gridcolor: "#e5e5e5",
              linecolor: "#D1D1D6",
            },
            yaxis: {
              title: yAxisTitle || "Y 축",
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
              zeroline: false,
              showgrid: true,
              gridcolor: "#e5e5e5",
              linecolor: "#D1D1D6",
            },
            xaxis2: {
              domain: [0.7, 0.95],
              anchor: "y2",
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            yaxis2: {
              domain: [0.7, 0.95],
              anchor: "x2",
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            showlegend: false,
            legend: {
              title: { text: clusterGroupTitle || "설명" },
              orientation: "h",
              x: 0,
              y: -0.2,
              font: { size: 12 },
            },
            plot_bgcolor: "#f9f9f9",
            paper_bgcolor: "#f9f9f9",
            height: 600,
            margin: { t: 50, l: 50, r: 50, b: 100 },
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: "#1D1D1F",
            },
            hovermode: "closest",
            autosize: true,
          }}
          config={{ responsive: true }}
        />
        {xAxisTitle && xAxisDescription && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.typographyBody2}
          >
            <strong>{`${xAxisTitle} (x)`}</strong>: {xAxisDescription}
          </Typography>
        )}
        {yAxisTitle && yAxisDescription && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.typographyBody2}
          >
            <strong>{`${yAxisTitle} (y)`}</strong>: {yAxisDescription}
          </Typography>
        )}
        {clusterGroupDescription && (
          <Typography
            variant="body2"
            gutterBottom
            className={classes.typographyBody2}
          >
            {clusterGroupDescription}
          </Typography>
        )}
      </div>
    );
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
          <p className="text-4xl font-bold text-center mb-8">
            {reportTitle}
          </p>
          <Card>
            <CardHeader>
              <CardTitle>
                {kmeansCase.overview_section_title || "개요"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="h6" sx={{ fontSize: '20px', padding: '10px 0' }}>
                ◾ 분석 목적
              </Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.analysis_purpose || "분석 목적이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6" sx={{ fontSize: '20px', padding: '10px 0' }}>
                ◾ 데이터 설명
              </Typography>
              <Typography variant="body1" gutterBottom>
                {overview?.data_description || "데이터 설명이 제공되지 않았습니다."}
              </Typography>

              <Typography variant="h6" sx={{ fontSize: '20px', padding: '10px 0' }}>
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
            <TabsList className="grid grid-cols-3 w-full space-x-4">
              {isAnomalyDetection ? (
                <TabsTrigger
                  value="anomalies"
                  className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  이상치
                </TabsTrigger>
              ) : (
                <TabsTrigger
                  value="clusters_graph"
                  className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  클러스터 그래프
                </TabsTrigger>
              )}
              <TabsTrigger
                value="clusters_distribution"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                군집 분포
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="border border-gray-300 rounded-t-lg py-2 px-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                모든 데이터 확인하기
              </TabsTrigger>
            </TabsList>
            {isAnomalyDetection && (
              <TabsContent value="anomalies">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {visualizationsInfo[2]?.title || "이상치 탐지"}
                    </CardTitle>
                    <CardDescription className="p-4">
                      {visualizationsInfo[2]?.description ||
                        "클러스터 내에서 감지된 이상치를 시각화합니다."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <label
                        htmlFor="anomaly-slider"
                        className="block text-lg font-semibold text-gray-700 mb-2"
                      >
                        {kmeansCase.slider_title || "클러스터 당 이상치 수"}: {numAnomalies}
                      </label>
                      <Slider
                        id="anomaly-slider"
                        min={1}
                        max={10}
                        step={1}
                        value={[numAnomalies]}
                        onValueChange={handleNumAnomaliesChange}
                      />
                    </div>
                    <div className="relative">
                      {renderAnomalyScatterPlot()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {!isAnomalyDetection && (
              <TabsContent value="clusters_graph">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {visualizationsInfo[1]?.title || "클러스터 그래프"}
                    </CardTitle>
                    <CardDescription>
                      {visualizationsInfo[1]?.description ||
                        "2D 공간에서 클러스터를 시각화합니다."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {renderClusterScatterPlot()}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="clusters_distribution">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {visualizationsInfo[0]?.title || "클러스터 분포"}
                  </CardTitle>
                  <CardDescription>
                    {visualizationsInfo[0]?.description ||
                      "클러스터의 크기 및 분포에 대한 개요"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {renderClusterDistribution()}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {kmeansCase.data_table_title || "클러스터링된 데이터 샘플"}
                  </CardTitle>
                  <CardDescription>
                    클러스터링된 데이터 포인트의 상세 보기
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderClusteredDataTable()}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          {renderClusterInformation()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#8770b4', padding: '15px 10px 0' }}>
                  {explanation.key_findings_section_title || "주목할만한 부분"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {keyFindings.map((finding, index) => (
                    <li key={index} className={classes.listItem}>
                      <strong>{finding.finding}</strong>: {finding.impact}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card style={{ padding: '10px'}}>
              <CardHeader>
                <CardTitle style={{ padding: '5px 10px 0' }}>
                  {explanation.recommendations_section_title || "권장 사항"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {recommendationActions.immediate_actions &&
                    recommendationActions.immediate_actions.map((action, index) => (
                      <li key={index} className={classes.listItem}>
                        {action}
                      </li>
                    ))}
                  {recommendationActions.further_analysis &&
                    recommendationActions.further_analysis.map((action, index) => (
                      <li key={index} className={classes.listItem}>
                        {action}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          {explanation.model_performance?.metrics &&
            explanation.model_performance.metrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle style={{ padding: '15px 10px 0' }}>
                    {explanation.model_performance_section_title || "모델 성능"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography variant="h6" style={{ paddingBottom: '10px' }}>
                    ◾ 주요 메트릭
                  </Typography>
                  {explanation.model_performance.metrics.map((metric, index) => (
                    <div key={index} className="mb-2" style={{ gap: '10px' }}>
                      <Typography variant="body1">
                        <strong>{metric.metric_name}:</strong> {metric.metric_value}
                      </Typography>
                      <Typography variant="body2" color="black">
                        {metric.interpretation}
                      </Typography>
                    </div>
                  ))}
                  {explanation.model_performance.prediction_analysis && (
                    <>
                      <Typography
                        variant="h6"
                        className="mt-4"
                        style={{ paddingBottom: '10px', paddingTop: '10px' }}
                      >
                        ◾ 예측 분석
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>전체 정확도:</strong>{" "}
                        {explanation.model_performance.prediction_analysis.overall_accuracy}
                      </Typography>
                      <Typography
                        variant="body1"
                        style={{ color: '#8770b4', padding: '15px 0 10px', fontSize: '18px' }}
                      >
                        <strong>◾ 주목할 만한 패턴:</strong>
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
        </>
      )}
    </div>
  );
}

KMeansVisualization.propTypes = {
  result: PropTypes.shape({
    feature_columns_used: PropTypes.arrayOf(PropTypes.string),
    cluster_label: PropTypes.string,
    graph4: PropTypes.shape({
      clustered_data_sample: PropTypes.object,
    }),
    scaler_mean: PropTypes.arrayOf(PropTypes.number),
    scaler_scale: PropTypes.arrayOf(PropTypes.number),
    cluster_centers: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    model: PropTypes.string,
  }).isRequired,
  explanation: PropTypes.shape({
    overview: PropTypes.shape({
      analysis_purpose: PropTypes.string,
      data_description: PropTypes.string,
      models_used: PropTypes.shape({
        model_name: PropTypes.string,
        model_description: PropTypes.string,
      }),
    }),
    key_findings: PropTypes.arrayOf(
      PropTypes.shape({
        finding: PropTypes.string,
        impact: PropTypes.string,
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
        yaxis_title: PropTypes.string,
      })
    ),
    model_specific_details: PropTypes.shape({
      details: PropTypes.shape({
        kmeans_clustering_case: PropTypes.shape({
          report_title: PropTypes.string,
          x_axis_title: PropTypes.string,
          x_axis_description: PropTypes.string,
          y_axis_title: PropTypes.string,
          y_axis_description: PropTypes.string,
          cluster_group_title: PropTypes.string,
          cluster_group_description: PropTypes.string,
          cluster: PropTypes.shape({
            cluster_title: PropTypes.arrayOf(PropTypes.string),
            cluster_description: PropTypes.arrayOf(PropTypes.string),
          }),
          data_table_title: PropTypes.string,
          slider_title: PropTypes.string,
        }),
      }),
    }),
    key_findings_section_title: PropTypes.string,
    recommendations_section_title: PropTypes.string,
    model_performance_section_title: PropTypes.string,
    model_performance: PropTypes.shape({
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          metric_name: PropTypes.string.isRequired,
          metric_value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
          ]).isRequired,
          interpretation: PropTypes.string.isRequired,
        })
      ),
      prediction_analysis: PropTypes.shape({
        overall_accuracy: PropTypes.string,
        notable_patterns: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
  }).isRequired,
};
