// // components/KMeansVisualization.js

// import React, { useState, useEffect } from 'react';
// import Plot from 'react-plotly.js';
// import { Slider, Typography } from '@mui/material';
// import { DataGrid } from '@mui/x-data-grid';
// import { PCA } from 'ml-pca';
// import convexHull from 'convex-hull';
// import * as d3 from 'd3'; // For color scales

// function KMeansVisualization({ result }) {
//   // State variables
//   const [clusterData, setClusterData] = useState([]);
//   const [clusterSizes, setClusterSizes] = useState({});
//   const [clusterCentersPca, setClusterCentersPca] = useState([]);
//   const [anomalies, setAnomalies] = useState([]);
//   const [numAnomalies, setNumAnomalies] = useState(3);
//   const [isAnomalyDetection, setIsAnomalyDetection] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (result) {
//       processData();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [result, numAnomalies]);

//   const processData = () => {
//     try {
//       const clusterLabel = result.cluster_label || 'Cluster_Anomaly';
//       const featureColumns = result.feature_columns_used || [];
//       const clusteredDataSample = result.graph4?.clustered_data_sample || {};
//       const scalerMean = result.scaler_mean || [];
//       const scalerScale = result.scaler_scale || [];
//       const clusterCenters = result.cluster_centers || [];
//       const modelName = result.model.toLowerCase();

//       setIsAnomalyDetection(modelName.includes('anomalydetection'));

//       // Convert clusteredDataSample to array of objects
//       const dfSample = [];
//       const sampleKeys = Object.keys(clusteredDataSample).filter(key => key !== clusterLabel);
//       const numSamples = clusteredDataSample[sampleKeys[0]]?.length || 0;

//       for (let i = 0; i < numSamples; i++) {
//         const row = {};
//         sampleKeys.forEach(key => {
//           row[key] = clusteredDataSample[key][i];
//         });
//         row[clusterLabel] = clusteredDataSample[clusterLabel][i];
//         dfSample.push(row);
//       }

//       if (!dfSample.length) {
//         setError("No data available for visualization.");
//         return;
//       }

//       // Prepare data for PCA
//       const X = dfSample.map(row => featureColumns.map(col => row[col]));

//       // Check dimensions
//       if (X.length === 0 || X[0].length === 0) {
//         setError("Data is empty or improperly formatted.");
//         return;
//       }

//       console.log('dfSample length:', dfSample.length);
//       console.log('X length:', X.length);
//       console.log('scalerMean length:', scalerMean.length);
//       console.log('scalerScale length:', scalerScale.length);

//       // Scale the data manually
//       const X_scaled = X.map(row => row.map((value, i) => (value - scalerMean[i]) / scalerScale[i]));

//       // Check for NaN or undefined values in X_scaled
//       const hasInvalidValues = X_scaled.some(row => row.some(value => isNaN(value) || value === undefined));
//       if (hasInvalidValues) {
//         setError("Data contains invalid values after scaling.");
//         return;
//       }

//       // Perform PCA
//       const pca = new PCA(X_scaled);
//       const X_pca_matrix = pca.predict(X_scaled, { nComponents: 2 });
//       const X_pca = X_pca_matrix.to2DArray(); // Convert Matrix to 2D array

//       console.log('X_pca length:', X_pca.length); // Should be 311

//       // Transform cluster centers (already scaled)
//       const clusterCentersScaled = clusterCenters; // Assuming centers are already scaled
//       const centers_pca_matrix = pca.predict(clusterCentersScaled, { nComponents: 2 });
//       const centers_pca = centers_pca_matrix.to2DArray();

//       console.log('centers_pca length:', centers_pca.length); // Should match number of clusters

//       // Add PC1 and PC2 to dfSample
//       const dfSampleWithPca = dfSample.map((row, index) => ({
//         ...row,
//         PC1: X_pca[index][0],
//         PC2: X_pca[index][1],
//       }));

//       // Compute cluster sizes
//       const sizes = {};
//       dfSampleWithPca.forEach(row => {
//         const cluster = row[clusterLabel];
//         sizes[cluster] = (sizes[cluster] || 0) + 1;
//       });

//       setClusterData(dfSampleWithPca);
//       setClusterSizes(sizes);
//       setClusterCentersPca(centers_pca);

//       // Compute anomalies if necessary
//       if (isAnomalyDetection) {
//         const anomaliesData = computeAnomalies(dfSampleWithPca, centers_pca, clusterLabel, numAnomalies);
//         setAnomalies(anomaliesData);
//       }

//       setError(null); // Clear any previous errors
//     } catch (e) {
//       console.error("Error processing data:", e);
//       setError("Failed to process data for visualization.");
//     }
//   };

//   const computeAnomalies = (data, centers_pca, clusterLabel, numAnomalies) => {
//     const anomalies = [];
//     const clusters = {};

//     data.forEach(row => {
//       const cluster = row[clusterLabel];
//       if (!clusters[cluster]) clusters[cluster] = [];
//       clusters[cluster].push(row);
//     });

//     Object.keys(clusters).forEach(cluster => {
//       const clusterIndex = parseInt(cluster, 10);
//       const center = centers_pca[clusterIndex];
//       if (!center) return; // Ensure center exists
//       const points = clusters[cluster].map(row => ({
//         ...row,
//         distance: Math.sqrt(Math.pow(row.PC1 - center[0], 2) + Math.pow(row.PC2 - center[1], 2)),
//       }));
//       // Sort points by distance descending and take top N
//       points.sort((a, b) => b.distance - a.distance);
//       const topAnomalies = points.slice(0, numAnomalies);
//       anomalies.push(...topAnomalies);
//     });

//     return anomalies;
//   };

//   // Event handler for slider change
//   const handleNumAnomaliesChange = (event, value) => {
//     setNumAnomalies(value);
//   };

//   // Render Cluster Distribution Bar Chart
//   const renderClusterDistribution = () => {
//     return (
//       <Plot
//         data={[
//           {
//             x: Object.keys(clusterSizes),
//             y: Object.values(clusterSizes),
//             type: 'bar',
//             marker: { color: 'rgba(55,128,191,0.7)' },
//           },
//         ]}
//         layout={{
//           title: 'Number of Data Points per Cluster',
//           xaxis: { title: 'Cluster' },
//           yaxis: { title: 'Number of Data Points' },
//         }}
//       />
//     );
//   };

//   // Render Cluster Scatter Plot with Convex Hulls and Centroids
//   const renderClusterScatterPlot = () => {
//     if (!clusterData.length) return null;

//     const clusterLabel = result.cluster_label || 'Cluster_Anomaly';
//     const clusters = [...new Set(clusterData.map(d => d[clusterLabel]))];
//     const colors = d3.schemeCategory10; // Using D3's color scheme

//     const data = clusters.map((cluster, i) => {
//       const clusterPoints = clusterData.filter(d => d[clusterLabel] === cluster);
//       return {
//         x: clusterPoints.map(d => d.PC1),
//         y: clusterPoints.map(d => d.PC2),
//         mode: 'markers',
//         type: 'scatter',
//         name: `Cluster ${cluster}`,
//         marker: { color: colors[i % colors.length], size: 6 },
//       };
//     });

//     // Add cluster centers
//     data.push({
//       x: clusterCentersPca.map(c => c[0]),
//       y: clusterCentersPca.map(c => c[1]),
//       mode: 'markers',
//       type: 'scatter',
//       name: 'Cluster Centers',
//       marker: { color: 'black', symbol: 'x', size: 12 },
//     });

//     // Add convex hulls (expanded areas)
//     clusters.forEach((cluster, i) => {
//       const clusterPoints = clusterData.filter(d => d[clusterLabel] === cluster);
//       const points = clusterPoints.map(d => [d.PC1, d.PC2]);
//       if (points.length >= 3) {
//         const hullIndices = convexHull(points);
//         const hullPoints = hullIndices.map(indexPair => points[indexPair[0]]);
//         // Expand the convex hull
//         const clusterIndex = parseInt(cluster, 10);
//         const centroid = [
//           clusterCentersPca[clusterIndex][0],
//           clusterCentersPca[clusterIndex][1],
//         ];
//         const expandedHullPoints = hullPoints.map(([x, y]) => {
//           const dx = x - centroid[0];
//           const dy = y - centroid[1];
//           return [
//             centroid[0] + dx * 1.1,
//             centroid[1] + dy * 1.1,
//           ];
//         });
//         const x = expandedHullPoints.map(p => p[0]);
//         const y = expandedHullPoints.map(p => p[1]);
//         data.push({
//           x: [...x, x[0]],
//           y: [...y, y[0]],
//           mode: 'lines',
//           fill: 'toself',
//           fillcolor: colors[i % colors.length],
//           opacity: 0.2,
//           line: { color: colors[i % colors.length] },
//           name: `Cluster ${cluster} Area`,
//           showlegend: false,
//         });
//       }
//     });

//     return (
//       <Plot
//         data={data}
//         layout={{
//           title: 'Cluster Scatter Plot',
//           xaxis: { title: 'PC1' },
//           yaxis: { title: 'PC2' },
//           showlegend: true,
//           height: 600,
//         }}
//       />
//     );
//   };

//   // Render Clustered Data Table
//   const renderClusteredDataTable = () => {
//     if (!clusterData.length) return null;
//     const columns = Object.keys(clusterData[0]).map(key => ({
//       field: key,
//       headerName: key,
//       width: 150,
//     }));
//     const rows = clusterData.map((row, index) => ({ id: index, ...row }));
//     return (
//       <div style={{ height: 500, width: '100%' }}>
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           pageSize={20}
//           rowsPerPageOptions={[20, 50, 100]}
//           checkboxSelection
//           disableSelectionOnClick
//         />
//       </div>
//     );
//   };

//   // Render Anomaly Scatter Plot
//   const renderAnomalyScatterPlot = () => {
//     if (!clusterData.length || !isAnomalyDetection) return null;

//     const clusterLabel = result.cluster_label || 'Cluster_Anomaly';
//     const clusters = [...new Set(clusterData.map(d => d[clusterLabel]))];
//     const colors = d3.schemeCategory10;

//     const data = clusters.map((cluster, i) => {
//       const clusterPoints = clusterData.filter(d => d[clusterLabel] === cluster);
//       return {
//         x: clusterPoints.map(d => d.PC1),
//         y: clusterPoints.map(d => d.PC2),
//         mode: 'markers',
//         type: 'scatter',
//         name: `Cluster ${cluster}`,
//         marker: { color: colors[i % colors.length], size: 6 },
//       };
//     });

//     // Add anomalies
//     data.push({
//       x: anomalies.map(a => a.PC1),
//       y: anomalies.map(a => a.PC2),
//       mode: 'markers',
//       type: 'scatter',
//       name: 'Anomalies',
//       marker: { color: 'red', symbol: 'x', size: 12 },
//     });

//     // Add lines from anomalies to cluster centers
//     anomalies.forEach(anomaly => {
//       const cluster = anomaly[clusterLabel];
//       const clusterIndex = parseInt(cluster, 10);
//       const center = clusterCentersPca[clusterIndex];
//       if (center) { // Ensure center exists
//         data.push({
//           x: [anomaly.PC1, center[0]],
//           y: [anomaly.PC2, center[1]],
//           mode: 'lines',
//           line: { color: 'gray', dash: 'dash' },
//           showlegend: false,
//         });
//       }
//     });

//     // Add cluster centers
//     data.push({
//       x: clusterCentersPca.map(c => c[0]),
//       y: clusterCentersPca.map(c => c[1]),
//       mode: 'markers',
//       type: 'scatter',
//       name: 'Cluster Centers',
//       marker: { color: 'black', symbol: 'diamond', size: 12 },
//     });

//     // Enlarge cluster areas
//     clusters.forEach((cluster, i) => {
//       const clusterPoints = clusterData.filter(d => d[clusterLabel] === cluster);
//       const points = clusterPoints.map(d => [d.PC1, d.PC2]);
//       if (points.length >= 3) {
//         const hullIndices = convexHull(points);
//         const hullPoints = hullIndices.map(indexPair => points[indexPair[0]]);
//         // Expand the convex hull
//         const clusterIndex = parseInt(cluster, 10);
//         const centroid = [
//           clusterCentersPca[clusterIndex][0],
//           clusterCentersPca[clusterIndex][1],
//         ];
//         const expandedHullPoints = hullPoints.map(([x, y]) => {
//           const dx = x - centroid[0];
//           const dy = y - centroid[1];
//           return [
//             centroid[0] + dx * 1.1,
//             centroid[1] + dy * 1.1,
//           ];
//         });
//         const x = expandedHullPoints.map(p => p[0]);
//         const y = expandedHullPoints.map(p => p[1]);
//         data.push({
//           x: [...x, x[0]],
//           y: [...y, y[0]],
//           mode: 'lines',
//           fill: 'toself',
//           fillcolor: colors[i % colors.length],
//           opacity: 0.2,
//           line: { color: colors[i % colors.length] },
//           name: `Cluster ${cluster} Area`,
//           showlegend: false,
//         });
//       }
//     });

//     return (
//       <Plot
//         data={data}
//         layout={{
//           title: 'Anomaly Detection Scatter Plot',
//           xaxis: { title: 'PC1' },
//           yaxis: { title: 'PC2' },
//           showlegend: true,
//           height: 600,
//         }}
//       />
//     );
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
//       {!error && (
//         <>
//           <h2>Cluster Distribution</h2>
//           {renderClusterDistribution()}
//           <h2>Cluster Scatter Plot</h2>
//           {renderClusterScatterPlot()}
//           <h2>Clustered Data Sample</h2>
//           {renderClusteredDataTable()}
//           {isAnomalyDetection && (
//             <div style={{ marginTop: '40px' }}>
//               <Typography id="num-anomalies-slider" gutterBottom>
//                 Number of anomalies to highlight per cluster:
//               </Typography>
//               <Slider
//                 value={numAnomalies}
//                 onChange={handleNumAnomaliesChange}
//                 aria-labelledby="num-anomalies-slider"
//                 valueLabelDisplay="on"
//                 step={1}
//                 marks
//                 min={1}
//                 max={10}
//               />
//               <h2>Anomaly Scatter Plot</h2>
//               {renderAnomalyScatterPlot()}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// export default KMeansVisualization;
