// src/app/test/page.js

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import of 보고서 형식들
const KMeansVisualization = dynamic(
  () => import("../chat/components/analyzeReport/KMeansVisualization.js"),
  { ssr: false, loading: () => <p>Loading visualization...</p> }
);

const LogisticRegressionVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/LogisticsRegressionVisualization.js"
    ),
  { ssr: false, loading: () => <p>Loading visualization...</p> }
);

const ClassifierVisualization = dynamic(
  () => import("../chat/components/analyzeReport/RandomForestClassifierVisualization.js"),
  { ssr: false, loading: () => <p>Loading regression visualization...</p> }
); // test Case 2

const RegressionVisualization = dynamic(
  () => import("../chat/components/analyzeReport/RandomForestRegressionVisualization.js"),
  { ssr: false, loading: () => <p>Loading classification visualization...</p> }
); // test Case 1

export default function Test() {
  const [jsonResult, setJsonResult] = useState(null);
  const [jsonExplanation, setJsonExplanation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [resultResponse, explanationResponse] = await Promise.all([
          // fetch("/json/test_6.json"),
          // fetch("/json/test_6_explanation.json"),
          // fetch("/json/test_5.json"),
          // fetch("/json/test_5_explanation.json"),
          // fetch("/json/test_4.json"),
          // fetch("/json/test_4_explanation.json"),
          // fetch("/json/test_3.json"),
          // fetch("/json/test_3_explanation.json"),
          // fetch("/json/test_2.json"), // Classification
          // fetch("/json/test_2_explanation.json"),
          fetch("/json/test_1.json"), // Regression
          fetch("/json/test_1_explanation.json"),
        ]);

        if (!resultResponse.ok || !explanationResponse.ok) {
          throw new Error(
            `HTTP error! status: ${resultResponse.status} and ${explanationResponse.status}`
          );
        }

        const resultData = await resultResponse.json();
        const explanationData = await explanationResponse.json();

        console.log("Fetched result data:", resultData);
        console.log("Fetched explanation data:", explanationData);

        setJsonResult(resultData);
        setJsonExplanation(explanationData);
      } catch (err) {
        console.error("Failed to fetch JSON data:", err);
        setError("Failed to load analysis results.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {isLoading && <p>Loading visualization...</p>}
      {error && <p>{error}</p>}
      {jsonResult && jsonExplanation && (
        // <KMeansVisualization
        //     result={jsonResult.result}
        //     explanation={jsonExplanation.result}
        // />
        // <LogisticRegressionVisualization
        //   result={jsonResult.result}
        //   explanation={jsonExplanation.result}
        // />
        //   <ClassifierVisualization
        //   result={jsonResult.result}
        //   explanation={jsonExplanation.result}
        // />
        <RegressionVisualization
          result={jsonResult.result}
          explanation={jsonExplanation.result}
        />
      )}
    </div>
  );
}
