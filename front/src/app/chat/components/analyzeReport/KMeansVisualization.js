// src/app/chat/components/analyzeReport/KMeansVisualization.js

import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import {
  Slider,
  Typography,
  Card,
  CardContent,
  Box,
  Container,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { PCA } from 'ml-pca';
import convexHull from 'convex-hull';
import * as d3 from 'd3'; // For color scales
import useAnalyzingKmeansStyles from '/styles/analyzingKmeansStyle.js'; // Adjust the path as necessary
import PropTypes from 'prop-types'; // For prop type validation

function KMeansVisualization({ result, explanation }) {
  const classes = useAnalyzingKmeansStyles();

  // **Define featureColumns at the top level**
  const featureColumns = Array.isArray(result.feature_columns_used)
    ? result.feature_columns_used
    : [];

  // State variables
  const [clusterData, setClusterData] = useState([]);
  const [clusterSizes, setClusterSizes] = useState({});
  const [clusterCentersPca, setClusterCentersPca] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [numAnomalies, setNumAnomalies] = useState(3);
  const [isAnomalyDetection, setIsAnomalyDetection] = useState(false);
  const [error, setError] = useState(null);

  // Extract overview information
  const { analysis_purpose, data_description, models_used } =
    explanation.overview || {};

  const keyFindings = explanation.key_findings || [];
  const recommendations = explanation.recommendations || {};
  const visualizationsInfo = explanation.visualizations || [];
  const clusterDescriptions = explanation.cluster?.cluster_description || [];
  const clusterTitles = explanation.cluster?.cluster_title || [];

  // Extract axis titles and descriptions
  const {
    'x-axis_title': xAxisTitle,
    'x-axis_description': xAxisDescription,
    'y-axis_title': yAxisTitle,
    'y-axis_description': yAxisDescription,
    cluster_title: clusterGroupTitle, // For legend title
    cluster_description: clusterGroupDescription, // Description of cluster groups
  } = explanation;

  useEffect(() => {
    if (result) {
      processData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, numAnomalies]);

  const processData = () => {
    try {
      const clusterLabel = result.cluster_label || 'Cluster_Anomaly';
      const clusteredDataSample = result.graph4?.clustered_data_sample || {};
      const scalerMean = result.scaler_mean || [];
      const scalerScale = result.scaler_scale || [];
      const clusterCenters = result.cluster_centers || [];
      const modelName = result.model.toLowerCase();

      setIsAnomalyDetection(modelName.includes('anomalydetection'));

      // Convert clusteredDataSample to array of objects
      const dfSample = [];
      const sampleKeys = Object.keys(clusteredDataSample).filter(
        (key) => key !== clusterLabel
      );
      const numSamples =
        clusteredDataSample[sampleKeys[0]]?.length || 0;

      for (let i = 0; i < numSamples; i++) {
        const row = {};
        sampleKeys.forEach((key) => {
          row[key] = clusteredDataSample[key][i];
        });
        row[clusterLabel] = clusteredDataSample[clusterLabel][i];
        dfSample.push(row);
      }

      if (!dfSample.length) {
        setError('No data available for visualization.');
        return;
      }

      // Prepare data for PCA
      const X = dfSample.map((row) =>
        featureColumns.map((col) => row[col])
      );

      // Check dimensions
      if (X.length === 0 || X[0].length === 0) {
        setError('Data is empty or improperly formatted.');
        return;
      }

      // Scale the data manually
      const X_scaled = X.map((row) =>
        row.map(
          (value, i) => (value - scalerMean[i]) / scalerScale[i]
        )
      );

      // Check for NaN or undefined values in X_scaled
      const hasInvalidValues = X_scaled.some((row) =>
        row.some((value) => isNaN(value) || value === undefined)
      );
      if (hasInvalidValues) {
        setError('Data contains invalid values after scaling.');
        return;
      }

      // Perform PCA
      const pca = new PCA(X_scaled);
      const X_pca_matrix = pca.predict(X_scaled, { nComponents: 2 });
      const X_pca = X_pca_matrix.to2DArray(); // Convert Matrix to 2D array

      // Transform cluster centers (already scaled)
      const clusterCentersScaled = clusterCenters;
      const centers_pca_matrix = pca.predict(clusterCentersScaled, {
        nComponents: 2,
      });
      const centers_pca = centers_pca_matrix.to2DArray();

      // Add PC1 and PC2 to dfSample
      const dfSampleWithPca = dfSample.map((row, index) => ({
        ...row,
        PC1: X_pca[index][0],
        PC2: X_pca[index][1],
      }));

      // Compute cluster sizes
      const sizes = {};
      dfSampleWithPca.forEach((row) => {
        const cluster = row[clusterLabel];
        sizes[cluster] = (sizes[cluster] || 0) + 1;
      });

      setClusterData(dfSampleWithPca);
      setClusterSizes(sizes);
      setClusterCentersPca(centers_pca);

      // Compute anomalies if necessary
      if (isAnomalyDetection) {
        const anomaliesData = computeAnomalies(
          dfSampleWithPca,
          centers_pca,
          clusterLabel,
          numAnomalies
        );
        setAnomalies(anomaliesData);
      }

      setError(null); // Clear any previous errors
    } catch (e) {
      console.error('Error processing data:', e);
      setError('Failed to process data for visualization.');
    }
  };

  const computeAnomalies = (
    data,
    centers_pca,
    clusterLabel,
    numAnomalies
  ) => {
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
      if (!center) return; // Ensure center exists
      const points = clusters[cluster].map((row) => ({
        ...row,
        distance: Math.sqrt(
          Math.pow(row.PC1 - center[0], 2) +
            Math.pow(row.PC2 - center[1], 2)
        ),
      }));
      // Sort points by distance descending and take top N
      points.sort((a, b) => b.distance - a.distance);
      const topAnomalies = points.slice(0, numAnomalies);
      anomalies.push(...topAnomalies);
    });

    return anomalies;
  };

  // Event handler for slider change
  const handleNumAnomaliesChange = (event, value) => {
    setNumAnomalies(value);
  };

  // Render Cluster Distribution Bar Chart
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
              type: 'bar',
              marker: { color: 'rgba(55,128,191,0.7)' },
              hoverinfo: 'y',
            },
          ]}
          layout={{
            title:
              visualizationsInfo[0]?.title || '클러스터별 직원 수',
            xaxis: {
              title: xAxisTitle || '클러스터',
              tickfont: { size: 14 },
              titlefont: { size: 16, family: 'Arial, sans-serif' },
            },
            yaxis: {
              title:
                visualizationsInfo[0]?.yaxis_title ||
                '직원 수',
              tickfont: { size: 14 },
              titlefont: { size: 16, family: 'Arial, sans-serif' },
            },
            plot_bgcolor: '#f9f9f9',
            paper_bgcolor: '#f9f9f9',
            height: 400,
            margin: { t: 50, l: 50, r: 50, b: 50 },
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#1D1D1F',
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

  // Render Cluster Scatter Plot with Convex Hulls and Centroids
  const renderClusterScatterPlot = () => {
    if (!clusterData.length) return null;

    const clusterLabel = result.cluster_label || 'Cluster_Anomaly';
    const clusters = [...new Set(clusterData.map((d) => d[clusterLabel]))];
    const colors = d3.schemeSet2; // Colorblind-friendly palette

    const data = [];

    // **1. Add Convex Hulls First**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      const points = clusterPoints.map((d) => [d.PC1, d.PC2]);

      if (points.length >= 3) {
        const hullIndices = convexHull(points);
        const hullPoints = hullIndices.map(
          (indexPair) => points[indexPair[0]]
        );

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
          mode: 'lines',
          fill: 'toself',
          fillcolor: colors[i % colors.length],
          opacity: 0.2,
          line: { color: colors[i % colors.length] },
          name: `${clusterTitles[i] || `Cluster ${cluster}`} Area`,
          hoverinfo: 'text',
          text: clusterTitles[i] || `Cluster ${cluster}`,
          hoveron: 'fills', // Enable hover on fills
        });
      }
    });

    // **2. Add Scatter Points Next**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      data.push({
        x: clusterPoints.map((d) => d.PC1),
        y: clusterPoints.map((d) => d.PC2),
        mode: 'markers',
        type: 'scatter',
        name: clusterTitles[i] || `Cluster ${cluster}`,
        marker: {
          color: colors[i % colors.length],
          size: 6,
          opacity: 0.8,
        },
        text: clusterPoints.map((d) => {
          const featureInfo = featureColumns
            .map((col) => `${col}: ${d[col]}`)
            .join('<br>');
          return `${featureInfo}<br>PC1: ${d.PC1.toFixed(
            2
          )}<br>PC2: ${d.PC2.toFixed(2)}`;
        }),
        hoverinfo: 'text',
        hoverlabel: {
          bgcolor: '#FFFFFF',
          bordercolor: '#CCCCCC',
        }, // Enhance hover label appearance
      });
    });

    // **3. Add Cluster Centers Last**
    data.push({
      x: clusterCentersPca.map((c) => c[0]),
      y: clusterCentersPca.map((c) => c[1]),
      mode: 'markers',
      type: 'scatter',
      name: 'Cluster Centers',
      marker: { color: 'black', symbol: 'x', size: 12 },
      hoverinfo: 'none',
    });

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={data}
          layout={{
            title:
              visualizationsInfo[1]?.title || '클러스터 산점도',
            xaxis: {
              title: xAxisTitle || '주요 성과 지표',
              tickfont: { size: 14 },
              titlefont: { size: 16, family: 'Arial, sans-serif' },
              zeroline: false,
              showgrid: true,
              gridcolor: '#e5e5e5',
              linecolor: '#D1D1D6',
            },
            yaxis: {
              title: yAxisTitle || '참여도 및 결근',
              tickfont: { size: 14 },
              titlefont: { size: 16, family: 'Arial, sans-serif' },
              zeroline: false,
              showgrid: true,
              gridcolor: '#e5e5e5',
              linecolor: '#D1D1D6',
            },
            legend: {
              title: { text: clusterGroupTitle || '직원 그룹' },
              orientation: 'h',
              x: 0,
              y: -0.2,
              font: { size: 12 },
            },
            plot_bgcolor: '#f9f9f9',
            paper_bgcolor: '#f9f9f9',
            height: 600,
            margin: { t: 50, l: 50, r: 50, b: 100 },
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#1D1D1F',
            },
            hovermode: 'closest',
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
        {/* Cluster Group Description */}
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

  // Render Clustered Data Table
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
      <div style={{ height: 500, width: '100%' }}>
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

  // Render Anomaly Scatter Plot
  const renderAnomalyScatterPlot = () => {
    if (!clusterData.length || !isAnomalyDetection) return null;

    const clusterLabel = result.cluster_label || 'Cluster_Anomaly';
    const clusters = [...new Set(clusterData.map((d) => d[clusterLabel]))];
    const colors = d3.schemeSet2; // Colorblind-friendly palette

    const data = [];

    // **1. Add Convex Hulls First**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      const points = clusterPoints.map((d) => [d.PC1, d.PC2]);

      if (points.length >= 3) {
        const hullIndices = convexHull(points);
        const hullPoints = hullIndices.map(
          (indexPair) => points[indexPair[0]]
        );

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
          mode: 'lines',
          fill: 'toself',
          fillcolor: colors[i % colors.length],
          opacity: 0.2,
          line: { color: colors[i % colors.length] },
          name: `${clusterTitles[i] || `Cluster ${cluster}`} Area`,
          hoverinfo: 'text',
          text: clusterTitles[i] || `Cluster ${cluster}`,
          hoveron: 'fills', // Enable hover on fills
        });
      }
    });

    // **2. Add Scatter Points Next**
    clusters.forEach((cluster, i) => {
      const clusterPoints = clusterData.filter(
        (d) => d[clusterLabel] === cluster
      );
      data.push({
        x: clusterPoints.map((d) => d.PC1),
        y: clusterPoints.map((d) => d.PC2),
        mode: 'markers',
        type: 'scatter',
        name: clusterTitles[i] || `Cluster ${cluster}`,
        marker: {
          color: colors[i % colors.length],
          size: 6,
          opacity: 0.8,
        },
        text: clusterPoints.map((d) => {
          const featureInfo = featureColumns
            .map((col) => `${col}: ${d[col]}`)
            .join('<br>');
          return `${featureInfo}<br>PC1: ${d.PC1.toFixed(
            2
          )}<br>PC2: ${d.PC2.toFixed(2)}`;
        }),
        hoverinfo: 'text',
        hoverlabel: {
          bgcolor: '#FFFFFF',
          bordercolor: '#CCCCCC',
        }, // Enhance hover label appearance
      });
    });

    // **3. Add Anomalies**
    data.push({
      x: anomalies.map((a) => a.PC1),
      y: anomalies.map((a) => a.PC2),
      mode: 'markers',
      type: 'scatter',
      name: 'Anomalies',
      marker: { color: 'red', symbol: 'x', size: 12 },
      hoverinfo: 'text',
      text: anomalies.map((a) => {
        const featureInfo = featureColumns
          .map((col) => `${col}: ${a[col]}`)
          .join('<br>');
        const clusterName =
          clusterTitles[a[clusterLabel]] || a[clusterLabel];
        return `${featureInfo}<br>PC1: ${a.PC1.toFixed(
          2
        )}<br>PC2: ${a.PC2.toFixed(2)}<br>Cluster: ${clusterName}`;
      }),
    });

    // **4. Add Lines from Anomalies to Cluster Centers**
    anomalies.forEach((anomaly) => {
      const cluster = anomaly[clusterLabel];
      const clusterIndex = parseInt(cluster, 10);
      const center = clusterCentersPca[clusterIndex];
      if (center) {
        data.push({
          x: [anomaly.PC1, center[0]],
          y: [anomaly.PC2, center[1]],
          mode: 'lines',
          line: { color: 'gray', dash: 'dash' },
          showlegend: false,
        });
      }
    });

    // **5. Add Cluster Centers Last**
    data.push({
      x: clusterCentersPca.map((c) => c[0]),
      y: clusterCentersPca.map((c) => c[1]),
      mode: 'markers',
      type: 'scatter',
      name: 'Cluster Centers',
      marker: { color: 'black', symbol: 'diamond', size: 12 },
      hoverinfo: 'none',
    });

    return (
      <div className={classes.plotContainer}>
        <Plot
          data={data}
          layout={{
            title:
              visualizationsInfo[2]?.title ||
              'Anomaly Detection Scatter Plot',
            xaxis: {
              title: xAxisTitle || '주요 성과 지표',
              tickfont: { size: 14 },
              titlefont: { size: 16, family: 'Arial, sans-serif' },
              zeroline: false,
              showgrid: true,
              gridcolor: '#e5e5e5',
              linecolor: '#D1D1D6',
            },
            yaxis: {
              title: yAxisTitle || '참여도 및 결근',
              tickfont: { size: 14 },
              titlefont: { size: 16, family: 'Arial, sans-serif' },
              zeroline: false,
              showgrid: true,
              gridcolor: '#e5e5e5',
              linecolor: '#D1D1D6',
            },
            legend: {
              title: { text: clusterGroupTitle || '직원 그룹' },
              orientation: 'h',
              x: 0,
              y: -0.2,
              font: { size: 12 },
            },
            plot_bgcolor: '#f9f9f9',
            paper_bgcolor: '#f9f9f9',
            height: 600,
            margin: { t: 50, l: 50, r: 50, b: 100 },
            font: {
              family:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#1D1D1F',
            },
            hovermode: 'closest',
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
        {/* Cluster Group Description */}
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
              {explanation.report_title || '직원 데이터 비정상 패턴 분석 보고서'}
            </Typography>
          </Box>

          {/* Analysis Overview */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {explanation.overview_section_title || '분석 개요'}
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
              {explanation.key_findings_section_title || '주요 발견사항'}
            </Typography>
            {keyFindings.map((finding, index) => (
              <Card
                key={index}
                variant="outlined"
                className={classes.card}
              >
                <CardContent className={classes.cardContent}>
                  <Typography
                    variant="h6"
                    className={classes.cardTitle}
                  >
                    {finding.finding}
                  </Typography>
                  <Typography
                    variant="body1"
                    className={classes.cardSubtitle}
                  >
                    {finding.impact_label || '영향'}: {finding.impact}
                  </Typography>
                  <Typography
                    variant="body1"
                    className={classes.bodyText}
                  >
                    {finding.recommendation_label ||
                      '권장사항'}
                    : {finding.recommendation}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Visualizations */}
          {visualizationsInfo.map((viz, index) => (
            <Box my={4} key={index}>
              <Typography
                variant="h5"
                gutterBottom
                className={classes.sectionTitle}
              >
                {viz.title || `시각화 ${index + 1}`}
              </Typography>
              {viz.description && (
                <Typography
                  variant="body2"
                  gutterBottom
                  className={classes.bodyText}
                >
                  {viz.description}
                </Typography>
              )}
              {index === 0 && renderClusterDistribution()}
              {index === 1 && renderClusterScatterPlot()}
              {index === 2 && isAnomalyDetection && renderAnomalyScatterPlot()}
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

          {/* Recommendations */}
          <Box my={4}>
            <Typography
              variant="h5"
              gutterBottom
              className={classes.sectionTitle}
            >
              {explanation.recommendations_section_title ||
                '권장사항'}
            </Typography>
            {recommendations.immediate_actions &&
              recommendations.immediate_actions.length > 0 && (
                <>
                  <Typography
                    variant="h6"
                    gutterBottom
                    className={classes.sectionTitle}
                  >
                    {recommendations.immediate_actions_title ||
                      '즉각적인 조치'}
                  </Typography>
                  <ul>
                    {recommendations.immediate_actions.map(
                      (action, index) => (
                        <li
                          key={index}
                          className={classes.listItem}
                        >
                          <Typography variant="body1">
                            {action}
                          </Typography>
                        </li>
                      )
                    )}
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
                    {recommendations.further_analysis_title ||
                      '추가 분석'}
                  </Typography>
                  <ul>
                    {recommendations.further_analysis.map(
                      (action, index) => (
                        <li
                          key={index}
                          className={classes.listItem}
                        >
                          <Typography variant="body1">
                            {action}
                          </Typography>
                        </li>
                      )
                    )}
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
              {explanation.data_table_title ||
                '클러스터된 데이터 샘플'}
            </Typography>
            {renderClusteredDataTable()}
          </Box>

          {/* Anomaly Detection (if applicable) */}
          {isAnomalyDetection && (
            <Box my={4}>
              <Typography
                id="num-anomalies-slider"
                gutterBottom
                className={classes.sectionTitle}
              >
                {explanation.slider_title ||
                  '클러스터당 이상치 수:'}
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
              <Box mt={4}>
                <Typography
                  variant="h5"
                  gutterBottom
                  className={classes.sectionTitle}
                >
                  {explanation.anomaly_plot_title ||
                    '이상 탐지 산점도'}
                </Typography>
                {renderAnomalyScatterPlot()}
              </Box>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

// **Prop Types Validation**
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
    'x-axis_title': PropTypes.string,
    'x-axis_description': PropTypes.string,
    'y-axis_title': PropTypes.string,
    'y-axis_description': PropTypes.string,
    cluster_title: PropTypes.string,
    cluster_description: PropTypes.string,
  }).isRequired,
};

export default KMeansVisualization;
