// src/app/chat/components/analyzeReport/KMeansVisualization.js

import React, { useState, useEffect } from "react";
//plotly.js 호출
import Plot from "react-plotly.js";
// Material-UI로 Interactive Chart Components
import {
  Slider,
  Typography,
  Card,
  CardContent,
  Box,
  Container,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
// PCA(주성분 분석)을 수행하기 위한 라이브러리 호출
import { PCA } from "ml-pca";
// 볼록 껍질(convex hull)을 계산하기 위한 라이브러리를 호출(클러스터 영역 정의)
import convexHull from "convex-hull";
import * as d3 from "d3"; // 색상 스케일 정의를 위해
import useAnalyzingKmeansStyles from "/styles/analyzingKmeansStyle.js"; // 스타일 코드
import PropTypes from "prop-types"; // 프롭된 값의 타입 검증
//아이콘
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// 이 컴포넌트는 KMeans(case5-6) 클러스터링 결과를 시각화하며, 산점도, 볼록 껍질, 이상치 및 데이터 테이블을 포함합니다.
function KMeansVisualization({ result, explanation }) {
  const classes = useAnalyzingKmeansStyles();

  // featureColumn들을 우선적으로 정의한다.
  const featureColumns = Array.isArray(result.feature_columns_used)
    ? result.feature_columns_used
    : [];

  // State 변수들
  // 클러스터 설명을 위한 정의
  const [clusters, setClusters] = useState({});
  const [clusterColorMap, setClusterColorMap] = useState({});
  // 아래는 렌더링을 위한 Cluster 정의
  const [clusterData, setClusterData] = useState([]); // 클러스터
  const [clusterSizes, setClusterSizes] = useState({}); // 클러스터 사이즈
  const [clusterCentersPca, setClusterCentersPca] = useState([]); // 클러스터 중심점
  const [anomalies, setAnomalies] = useState([]); // 이상치 저장 배열
  const [numAnomalies, setNumAnomalies] = useState(2); // 이상치 갯수 조절 슬라이더
  const [isAnomalyDetection, setIsAnomalyDetection] = useState(false); // Case 6의 여부(이상치 탐지)
  const [error, setError] = useState(null); //에러 유무
  const [showInset, setShowInset] = useState(true); // 작은 그래프

  // // "explanation" prop에서 분석 목적, 데이터 설명 및 모델 설명을 추출합니다.
  const { analysis_purpose, data_description, models_used } =
    explanation.overview || {};

  const keyFindings = explanation.key_findings || [];
  const recommendations = explanation.recommendations || {};
  const visualizationsInfo = explanation.visualizations || [];
  const clusterDescriptions = explanation.cluster?.cluster_description || [];
  const clusterTitles = explanation.cluster?.cluster_title || [];

  // 그래프의 축 값, 각 클러스터에 대한 설명
  const {
    "x-axis_title": xAxisTitle,
    "x-axis_description": xAxisDescription,
    "y-axis_title": yAxisTitle,
    "y-axis_description": yAxisDescription,
    cluster_title: clusterGroupTitle, // For legend title
    cluster_description: clusterGroupDescription, // Description of cluster groups
  } = explanation;

  // --- 변수 정의 끝 ---

  // 클러스터에 대한 일관된 색상 생성하는 도우미 함수
  const generateClusterColorMap = (clusters, colors) => {
    const map = {};
    clusters.forEach((cluster, i) => {
      map[cluster] = colors[i % colors.length];
    });
    return map;
  };

  // result이나 numAnomalies가 변경될 때마다 데이터를 처리합니다.
  useEffect(() => {
    if (result) {
      processData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, numAnomalies]);

  // 클러스터링 결과를 처리하고, PCA를 수행하며, 필요에 따라 이상치를 식별하는 함수입니다.
  const processData = () => {
    try {
      const clusterLabel = result.cluster_label || "Cluster_Anomaly";
      const clusteredDataSample = result.graph4?.clustered_data_sample || {};
      const scalerMean = result.scaler_mean || [];
      const scalerScale = result.scaler_scale || [];
      const clusterCenters = result.cluster_centers || [];
      const modelName = result.model.toLowerCase();

      // 모델 이름에 'anomalydetection'이 포함되어 있으면 Case6
      setIsAnomalyDetection(modelName.includes("anomalydetection"));
      console.log(isAnomalyDetection);

      // 결과 prop에서 클러스터 레이블과 샘플 데이터를 추출합니다.
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
        // 데이터 처리 후 사용 가능한 데이터가 없으면 오류 메시지를 설정합니다.
        setError("No data available for visualization.");
        return;
      }

      // 주성분 분석(PCA)을 위해 데이터를 준비합니다.
      const X = dfSample.map((row) => featureColumns.map((col) => row[col]));

      // 데이터의 차원이 올바른지 확인하고, 그렇지 않으면 오류를 설정합니다.
      if (X.length === 0 || X[0].length === 0) {
        setError("Data is empty or improperly formatted.");
        return;
      }

      // 제공된 스케일러 평균과 스케일을 사용하여 데이터를 수동으로 스케일링하여 정규화
      const X_scaled = X.map((row) =>
        row.map((value, i) => (value - scalerMean[i]) / scalerScale[i])
      );

      // 스케일링된 데이터에 유효하지 않은 값이 있는지 확인하고 발견되면 오류를 설정합니다.
      const hasInvalidValues = X_scaled.some((row) =>
        row.some((value) => isNaN(value) || value === undefined)
      );
      if (hasInvalidValues) {
        setError("Data contains invalid values after scaling.");
        return;
      }

      // 데이터의 차원을 2개 구성 요소로 줄이기 위해 PCA를 수행합니다.
      const pca = new PCA(X_scaled);
      const X_pca_matrix = pca.predict(X_scaled, { nComponents: 2 });
      const X_pca = X_pca_matrix.to2DArray(); // Convert Matrix to 2D array

      // 클러스터 중심점을 PCA를 사용하여 변환합니다 (이미 스케일링된 상태).
      const clusterCentersScaled = clusterCenters;
      const centers_pca_matrix = pca.predict(clusterCentersScaled, {
        nComponents: 2,
      });
      const centers_pca = centers_pca_matrix.to2DArray();

      // 각 데이터 샘플에 PCA 구성 요소(PC1, PC2)를 추가합니다.
      const dfSampleWithPca = dfSample.map((row, index) => ({
        ...row,
        PC1: X_pca[index][0],
        PC2: X_pca[index][1],
      }));

      // 각 클러스터의 점의 수(분포)를 계산합니다.
      const sizes = {};
      dfSampleWithPca.forEach((row) => {
        const cluster = row[clusterLabel];
        sizes[cluster] = (sizes[cluster] || 0) + 1;
      });

      // 클러스터 리스트 생성
      const clustersList = [
        ...new Set(dfSampleWithPca.map((d) => d[clusterLabel])),
      ];
      setClusters(clustersList); // 클러스터 리스트 상태 업데이트

      // 색상 스케일 정의 (Colorblind-friendly palette 사용)
      const colors = d3.schemeSet2;

      // 클러스터 색상 매핑 생성
      const newClusterColorMap = generateClusterColorMap(clustersList, colors);
      setClusterColorMap(newClusterColorMap); // 클러스터 색상 매핑 상태 업데이트

      // 처리된 데이터, 클러스터 크기 및 클러스터 중심점을 상태에 설정합니다.
      setClusterData(dfSampleWithPca);
      setClusterSizes(sizes);
      setClusterCentersPca(centers_pca);

      // Case6에서 각 클러스터에서 이상치를 식별합니다.
      if (isAnomalyDetection) {
        const anomaliesData = computeAnomalies(
          dfSampleWithPca,
          centers_pca,
          clusterLabel,
          numAnomalies
        );
        setAnomalies(anomaliesData);
      }

      // 이전에 발생한 오류 메시지를 초기화합니다.
      setError(null); // Clear any previous errors
    } catch (e) {
      console.error("Error processing data:", e);
      setError("Failed to process data for visualization.");
    }
  };

  // 클러스터 중심에서 가장 먼 포인트를 선택하여 이상치를 계산하는 함수입니다.
  const computeAnomalies = (data, centers_pca, clusterLabel, numAnomalies) => {
    // 이상치를 담을 배열 정의
    const anomalies = [];
    const clusters = {};

    // 각 클러스터별로 이상치를 식별하여 anomalies 배열에 추가합니다.
    data.forEach((row) => {
      const cluster = row[clusterLabel];
      if (!clusters[cluster]) clusters[cluster] = [];
      clusters[cluster].push(row);
    });

    Object.keys(clusters).forEach((cluster) => {
      const clusterIndex = parseInt(cluster, 10);
      const center = centers_pca[clusterIndex];
      if (!center) return; // Ensure center exists
      const points = clusters[cluster].map((row) => ({
        ...row,
        distance: Math.sqrt(
          Math.pow(row.PC1 - center[0], 2) + Math.pow(row.PC2 - center[1], 2)
        ),
      }));
      // Sort points by distance descending and take top N
      points.sort((a, b) => b.distance - a.distance);
      const topAnomalies = points.slice(0, numAnomalies);
      anomalies.push(...topAnomalies);
    });

    return anomalies;
  };

  // 슬라이더 값이 변경될 때 클러스터당 이상치 수를 업데이트하는 핸들러
  const handleNumAnomaliesChange = (event, value) => {
    setNumAnomalies(value);
  };

  // 각 클러스터의 직원 수를 보여주는 막대 차트를 렌더링하는 함수
  const renderClusterDistribution = () => {
    const clusterLabels = Object.keys(clusterSizes).map((cluster) => {
      const index = parseInt(cluster, 10);
      return clusterTitles[index] || `Cluster ${cluster}`;
    });
    const clusterCounts = Object.values(clusterSizes);

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
            title: visualizationsInfo[0]?.title || "클러스터별 직원 수",
            xaxis: {
              title: xAxisTitle || "클러스터",
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
            },
            yaxis: {
              title: visualizationsInfo[0]?.yaxis_title || "직원 수",
              tickfont: { size: 14 },
              titlefont: { size: 16, family: "Arial, sans-serif" },
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
        {/* Axis Description */}
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
      </div>
    );
  };

  // 클러스터 원 내부 막대 차트를 포함한 클러스터의 산점도를 렌더링
  const renderClusterScatterPlot = () => {
    if (!clusterData.length) return null;

    const clusterLabel = result.cluster_label || "Cluster_Anomaly";
    const clusters = [...new Set(clusterData.map((d) => d[clusterLabel]))];

    const colors = d3.schemeSet2; // Colorblind-friendly palette

    // Generate cluster color mapping
    const clusterColorMap = generateClusterColorMap(clusters, colors);

    const data = [];

    // **1. 클러스터 원을 먼저 그린다.(Convux hall)**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      const points = clusterPoints.map((d) => [d.PC1, d.PC2]);

      if (points.length >= 3) {
        const hullIndices = convexHull(points);
        const hullPoints = hullIndices.map((indexPair) => points[indexPair[0]]);

        // Expand the convex hull
        const clusterIndex = parseInt(cluster, 10);
        const centroid = [
          clusterCentersPca[clusterIndex][0],
          clusterCentersPca[clusterIndex][1],
        ];
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
          fillcolor: clusterColorMap[cluster],
          opacity: 0.2,
          line: { color: clusterColorMap[cluster] },
          name: `${clusterTitles[i] || `Cluster ${cluster}`} Area`,
          hoverinfo: "text",
          text: clusterTitles[i] || `Cluster ${cluster}`,
          hoveron: "fills", // Enable hover on fills
        });
      }
    });

    // **2. 산점도를 그린다.**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      data.push({
        x: clusterPoints.map((d) => d.PC1),
        y: clusterPoints.map((d) => d.PC2),
        mode: "markers",
        type: "scatter",
        name: clusterTitles[i] || `Cluster ${cluster}`,
        marker: {
          color: clusterColorMap[cluster],
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
        }, // Enhance hover label appearance
      });
    });

    // **3. 클러스터 중심을 추가한다.**
    data.push({
      x: clusterCentersPca.map((c) => c[0]),
      y: clusterCentersPca.map((c) => c[1]),
      mode: "markers",
      type: "scatter",
      name: "Cluster Centers",
      marker: { color: "black", symbol: "diamond", size: 12 },
      hoverinfo: "none",
    });

    // **4. Add Inset Cluster Distribution Bar Chart (Conditionally)**
    if (showInset) {
      const clusterLabels = clusters.map((cluster) => {
        const index = parseInt(cluster, 10);
        return clusterTitles[index] || `Cluster ${cluster}`;
      });
      const clusterCounts = clusters.map((cluster) => clusterSizes[cluster]);

      data.push({
        x: clusterLabels,
        y: clusterCounts,
        type: "bar",
        marker: { color: clusters.map((cluster) => clusterColorMap[cluster]) },
        hoverinfo: "y",
        name: "Cluster Distribution",
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      });
    }

    return (
      <div
        className={classes.plotContainer}
        style={{ position: "relative" }} // Ensure container is relative for absolute positioning
      >
        {/* **Toggle Button for Inset Plot** */}
        <IconButton
          onClick={() => setShowInset(!showInset)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
          }}
          aria-label="toggle inset plot"
        >
          {showInset ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
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
            // 클러스터의 각 인원을 나타내는 내부 Bar 그래프
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
            // 그래프의 요소들에 대해서 설명해주는 부분
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
          }}
          config={{ responsive: true }}
        />
        {/* 축에 대한 설명 */}
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
        {/* 각 그룹에 대한 설명 */}
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

  // 모든 점들에 대한 엑셀 형식의 시각화 렌더링 함수
  const renderClusteredDataTable = () => {
    if (!clusterData.length) return null;

    // Dynamically generate columns based on data keys
    const columns = Object.keys(clusterData[0]).map((key) => ({
      field: key,
      headerName: key,
      flex: 1,
      minWidth: 150,
    }));
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

  // 이상치 탐색 그래프를 렌더링하는 함수
  const renderAnomalyScatterPlot = () => {
    if (!clusterData.length || !isAnomalyDetection) return null;

    const clusterLabel = result.cluster_label || "Cluster_Anomaly";
    const clusters = [...new Set(clusterData.map((d) => d[clusterLabel]))];
    const colors = d3.schemeSet2; // Colorblind-friendly palette

    // Bar 차트와 이상치 그래프의 색상을 일치시키기 위한 함수
    const ClusterColorMap = generateClusterColorMap(clusters, colors);

    const data = [];

    // **1. 클러스터 원을 먼저 그린다.(Convux hall)**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      const points = clusterPoints.map((d) => [d.PC1, d.PC2]);

      if (points.length >= 3) {
        const hullIndices = convexHull(points);
        const hullPoints = hullIndices.map((indexPair) => points[indexPair[0]]);

        // Expand the convex hull
        const clusterIndex = parseInt(cluster, 10);
        const centroid = [
          clusterCentersPca[clusterIndex][0],
          clusterCentersPca[clusterIndex][1],
        ];
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
          fillcolor: clusterColorMap[cluster],
          opacity: 0.2,
          line: { color: clusterColorMap[cluster] },
          name: `${clusterTitles[i] || `Cluster ${cluster}`} Area`,
          hoverinfo: "text",
          text: clusterTitles[i] || `Cluster ${cluster}`,
          hoveron: "fills", // Enable hover on fills
        });
      }
    });

    // **2. 산점도를 추가한다.**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      data.push({
        x: clusterPoints.map((d) => d.PC1),
        y: clusterPoints.map((d) => d.PC2),
        mode: "markers",
        type: "scatter",
        name: clusterTitles[i] || `Cluster ${cluster}`,
        marker: {
          color: clusterColorMap[cluster],
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
        }, // Enhance hover label appearance
      });
    });

    // **3. 이상치를 추가한다.**
    data.push({
      x: anomalies.map((a) => a.PC1),
      y: anomalies.map((a) => a.PC2),
      mode: "markers",
      type: "scatter",
      name: "Anomalies",
      marker: { color: "red", symbol: "x", size: 12 },
      hoverinfo: "text",
      text: anomalies.map((a) => {
        const featureInfo = featureColumns
          .map((col) => `${col}: ${a[col]}`)
          .join("<br>");
        const clusterName = clusterTitles[a[clusterLabel]] || a[clusterLabel];
        return `${featureInfo}<br>PC1: ${a.PC1.toFixed(
          2
        )}<br>PC2: ${a.PC2.toFixed(2)}<br>Cluster: ${clusterName}`;
      }),
    });

    // **4. 각 클러스터 중심으로부터 이상치까지의 선을 추가한다.**
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

    // **5. 각 클러스터의 중심점을 추가한다.**
    data.push({
      x: clusterCentersPca.map((c) => c[0]),
      y: clusterCentersPca.map((c) => c[1]),
      mode: "markers",
      type: "scatter",
      name: "Cluster Centers",
      marker: { color: "black", symbol: "diamond", size: 12 },
      hoverinfo: "none",
    });

    // **6. 각 클러스터의 인원을 표시화는 bar Chart를 추가한다.**
    if (showInset) {
      const clusterLabels = clusters.map((cluster) => {
        const index = parseInt(cluster, 10);
        return clusterTitles[index] || `Cluster ${cluster}`;
      });
      const clusterCounts = clusters.map((cluster) => clusterSizes[cluster]);

      data.push({
        x: clusterLabels,
        y: clusterCounts,
        type: "bar",
        marker: { color: clusters.map((cluster) => clusterColorMap[cluster]) },
        hoverinfo: "y",
        name: "Cluster Distribution",
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      });
    }

    return (
      <div
        className={classes.plotContainer}
        style={{ position: "relative" }} // Ensure container is relative for absolute positioning
      >
        {/* 작은 Bar 차트를 켜고 클 수 있는 버튼 */}
        <IconButton
          onClick={() => setShowInset(!showInset)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
          }}
          aria-label="toggle inset plot"
        >
          {showInset ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
        <Plot
          data={data}
          layout={{
            title:
              visualizationsInfo[2]?.title || "Anomaly Detection Scatter Plot",
            xaxis: {
              title: xAxisTitle || "X 출",
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
            // Define inset axes
            xaxis2: {
              domain: [0.7, 0.95], // Adjusted position and size for better visibility
              anchor: "y2",
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            yaxis2: {
              domain: [0.7, 0.95], // Adjusted position and size for better visibility
              anchor: "x2",
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            // 그래프 요소들에 대한 설명
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
          }}
          config={{ responsive: true }}
        />
        {/* 축 설명 */}
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
        {/* 각 그룹에 대한 설명 */}
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

  // Final return
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
              {explanation.report_title || "AI 모델 분석 보고서"}
            </Typography>
          </Box>

          {/* Anomaly Detection (if applicable) */}
          <Box my={4}>
            {isAnomalyDetection ? (
              <>
                <Typography
                  variant="h5"
                  gutterBottom
                  className={classes.sectionTitle}
                >
                  {explanation.anomaly_plot_title ||
                    "데이터 영역 분류(이상값 탐지)"}
                </Typography>
                {renderAnomalyScatterPlot()}
                <Typography
                  id="num-anomalies-slider"
                  gutterBottom
                  className={classes.sectionTitle}
                >
                  {explanation.slider_title || "클러스터당 이상치 수:"}
                </Typography>
                <Slider
                  value={numAnomalies}
                  onChange={handleNumAnomaliesChange}
                  aria-labelledby="num-anomalies-slider"
                  valueLabelDisplay="on"
                  step={1}
                  marks
                  min={1}
                  max={10}
                  className={classes.slider}
                />
              </>
            ) : (renderClusterScatterPlot()
            )}
            <b>그래프에 대한 짧은 개요</b>
            {visualizationsInfo.map((viz, index) => (
              <Box my={4} key={index}>
                {viz.insights && (
                  <Typography
                    variant="body2"
                    gutterBottom
                    className={classes.bodyText}
                  >
                    {viz.insights}
                  </Typography>
                )}
              </Box>
            ))}
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              클러스터 설명
            </Typography>
            {clusterDescriptions.length > 0 ? (
              clusterDescriptions.map((desc, index) => {
                const clusterId = clusters[index]; // 현재 클러스터 ID 가져오기
                const color = clusterColorMap[clusterId] || "#000000"; // 색상 매핑에서 색상 가져오기, 기본값은 검정색
                return (
                  <Card
                    key={index}
                    variant="outlined"
                    className={classes.card}
                    style={{ borderColor: color }} // 카드 테두리 색상 설정
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        className={classes.cardTitle}
                        style={{ color: color }} // 제목 텍스트 색상 설정
                      >
                        {clusterTitles[index] || `Cluster ${index + 1}`}
                      </Typography>
                      <Typography variant="body1" className={classes.bodyText}>
                        {desc}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Typography variant="body1" className={classes.bodyText}>
                클러스터 설명이 제공되지 않았습니다.
              </Typography>
            )}
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
              {analysis_purpose}
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              className={classes.bodyText}
            >
              {data_description}
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              className={classes.bodyText}
            >
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
              {explanation.key_findings_section_title || "주요 발견사항"}
            </Typography>
            {keyFindings.map((finding, index) => (
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
          {/* Visualizations */}
          {visualizationsInfo.map((viz, index) => (
            <Box my={4} key={index}>
              {/* 그래프 제목 */}
              {/* <Typography
                variant="h5"
                gutterBottom
                className={classes.sectionTitle}
              >
                {viz.title || `시각화 ${index + 1}`}
              </Typography> */}

              {/* 그래프 설명 */}
              {/* {viz.description && (
                <Typography
                  variant="body2"
                  gutterBottom
                  className={classes.bodyText}
                >
                  {viz.description}
                </Typography>
              )} */}

              {/* 각 그래프 */}
              {/* {index === 0 && renderClusterScatterPlot()} */}
              {/* {index === 1 && isAnomalyDetection && renderAnomalyScatterPlot()} */}
              {/* 그래프에 대한 설명 */}
              {/* {viz.insights && (
                <Typography
                  variant="body2"
                  gutterBottom
                  className={classes.bodyText}
                >
                  {viz.insights}
                </Typography>
              )} */}
            </Box>
          ))}

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
                    {recommendations.immediate_actions_title || "즉각적인 조치"}
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

          {/* Clustered Data Table */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {explanation.data_table_title || "클러스터된 데이터 샘플"}
            </Typography>
            {renderClusteredDataTable()}
          </Box>
        </>
      )}
    </Container>
  );
}

// KMeansVisualization 컴포넌트의 prop 타입을 정의하여 타입 검사를 수행합니다.
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
        model_description: PropTypes.string,
      }),
    }),
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
    visualizations: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        insights: PropTypes.string,
        yaxis_title: PropTypes.string,
      })
    ),
    cluster: PropTypes.shape({
      cluster_title: PropTypes.arrayOf(PropTypes.string),
      cluster_description: PropTypes.arrayOf(PropTypes.string),
    }),
    report_title: PropTypes.string,
    overview_section_title: PropTypes.string,
    key_findings_section_title: PropTypes.string,
    recommendations_section_title: PropTypes.string,
    data_table_title: PropTypes.string,
    slider_title: PropTypes.string,
    anomaly_plot_title: PropTypes.string,
    "x-axis_title": PropTypes.string,
    "x-axis_description": PropTypes.string,
    "y-axis_title": PropTypes.string,
    "y-axis_description": PropTypes.string,
    cluster_title: PropTypes.string,
    cluster_description: PropTypes.string,
  }).isRequired,
};

export default KMeansVisualization;
