"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import all visualization components with loading fallback
const KMeansVisualization = dynamic(
  () => import("../chat/components/analyzeReport/KMeansVisualization.jsx"),
  { ssr: false, loading: () => <p>Loading K-Means Visualization...</p> }
);

const LogisticRegressionVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/LogisticsRegressionVisualization.jsx"
    ),
  {
    ssr: false,
    loading: () => <p>Loading Logistic Regression Visualization...</p>,
  }
);

const ClassifierVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/RandomForestClassifierVisualization.jsx"
    ),
  { ssr: false, loading: () => <p>Loading Classifier Visualization...</p> }
); // Test Case 2

const RegressionVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/RandomForestRegressionVisualization.jsx"
    ),
  { ssr: false, loading: () => <p>Loading Regression Visualization...</p> }
); // Test Case 1

const SupportVectorVisualization = dynamic(
  () =>
    import("../chat/components/analyzeReport/SupporVectorVisualization.jsx"),
  {
    ssr: false,
    loading: () => <p>Loading Support Vector Machine Visualization...</p>,
  }
);

const NeuralNetworkVisualization = dynamic(
  () =>
    import("../chat/components/analyzeReport/NeuralNetworkVisualization.jsx"),
  { ssr: false, loading: () => <p>Loading Neural Network Visualization...</p> }
);

// Define a list of all available visualizations with their corresponding components and data paths
const visualizationsList = [
  {
    name: "K-Means-anomaly",
    component: KMeansVisualization,
    resultPath: "/json/test_6.json",
    explanationPath: "/json/test_6_explanation.json",
  },
  {
    name: "K-Means-segmentation",
    component: KMeansVisualization,
    resultPath: "/json/test_5.json",
    explanationPath: "/json/test_5_explanation.json",
  },
  {
    name: "Logistic Regression-binary",
    component: LogisticRegressionVisualization,
    resultPath: "/json/test_3.json",
    explanationPath: "/json/test_3_explanation.json",
  },
  {
    name: "Logistic Regression-multi",
    component: LogisticRegressionVisualization,
    resultPath: "/json/test_4.json",
    explanationPath: "/json/test_4_explanation.json",
  },
  {
    name: "Random Forest Classifier",
    component: ClassifierVisualization,
    resultPath: "/json/test_2_up.json",
    explanationPath: "/json/test_2_up_explanation.json",
  },
  {
    name: "Random Forest Regressor",
    component: RegressionVisualization,
    resultPath: "/json/test_1_up.json",
    explanationPath: "/json/test_1_up_explanation.json",
  },
  {
    name: "Support Vector Machine",
    component: SupportVectorVisualization,
    resultPath: "/json/test_9.json",
    explanationPath: "/json/test_9_explanation.json",
  },
  {
    name: "Support Vector Machine-2",
    component: SupportVectorVisualization,
    resultPath: "/json/test_10.json",
    explanationPath: "/json/test_10_explanation.json",
  },
  {
    name: "Neural Network",
    component: NeuralNetworkVisualization,
    resultPath: "/json/test_7.json",
    explanationPath: "/json/test_7_explanation.json",
  },
];

export default function Test() {
  const [selectedVisualization, setSelectedVisualization] = useState(
    visualizationsList[4] // Default to Support Vector Machine
  );
  const [jsonResult, setJsonResult] = useState(null);
  const [jsonExplanation, setJsonExplanation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data whenever the selected visualization changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setJsonResult(null);
      setJsonExplanation(null);
      try {
        const { resultPath, explanationPath } = selectedVisualization;

        const [resultResponse, explanationResponse] = await Promise.all([
          fetch(resultPath),
          fetch(explanationPath),
        ]);

        if (!resultResponse.ok || !explanationResponse.ok) {
          throw new Error(
            `HTTP error! status: ${resultResponse.status} and ${explanationResponse.status}`
          );
        }

        const resultData = await resultResponse.json();
        const explanationData = await explanationResponse.json();

        console.log(
          `Fetched result data for ${selectedVisualization.name}:`,
          resultData
        );
        console.log(
          `Fetched explanation data for ${selectedVisualization.name}:`,
          explanationData
        );

        setJsonResult(resultData);
        setJsonExplanation(explanationData);

        console.log(resultData)
        console.log(explanationData)

      } catch (err) {
        console.error("Failed to fetch JSON data:", err);
        setError("Failed to load analysis results.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedVisualization]);

  // URL of the CSV file to download
  const csvDownloadUrl =
    "https://s3.ap-northeast-2.amazonaws.com/wadada-bucket/fe692d91-b65e-4239-81a4-8bc70afe1a67.csv";

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Visualization Selection Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {visualizationsList.map((viz) => (
          <button
            key={viz.name}
            onClick={() => setSelectedVisualization(viz)}
            className={`px-4 py-2 rounded-md border ${selectedVisualization.name === viz.name
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-blue-500 border-blue-500 hover:bg-blue-50"
              } transition duration-200`}
          >
            {viz.name}
          </button>
        ))}
      </div>

      {/* Download CSV Button */}
      <div className="flex justify-center">
        <a
          href={csvDownloadUrl}
          download={"거시기"}
          className="px-4 py-2 rounded-md border bg-green-500 text-white border-green-500 hover:bg-green-600 transition duration-200"
        >
          Download CSV
        </a>
      </div>

      {/* Loading and Error States */}
      {isLoading && <p>Loading visualization...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Render the selected visualization component when data is available */}
      {jsonResult && jsonExplanation && (
        <selectedVisualization.component
          result={(jsonResult.result)}
          explanation={jsonExplanation.result}
        />
      )}
    </div>
  );
}
