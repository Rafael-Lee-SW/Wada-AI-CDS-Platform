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
  () =>
    import(
      "../chat/components/analyzeReport/RandomForestClassifierVisualization.js"
    ),
  { ssr: false, loading: () => <p>Loading regression visualization...</p> }
); // test Case 2

const RegressionVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/RandomForestRegressionVisualization.js"
    ),
  { ssr: false, loading: () => <p>Loading classification visualization...</p> }
); // test Case 1

const SupporVectorVisualization = dynamic(
  () => import("../chat/components/analyzeReport/SupporVectorVisualization.js"),
  { ssr: false, loading: () => <p>Loading classification visualization...</p> }
);

const NeuralNetworkVisualization = dynamic(
  () =>
    import("../chat/components/analyzeReport/NeuralNetworkVisualization.js"),
  { ssr: false, loading: () => <p>Loading classification visualization...</p> }
);

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
        /**
         * 과거 테스트 흔적
         */
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
          // fetch("/json/test_7.json"),
          // fetch("/json/test_7_explanation.json"),
          // fetch("/json/test_9.json"),
          // fetch("/json/test_9_explanation.json"),
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

        /**
         * 새로운 테스트 데이터(최신)
         */
        // const response = await fetch("/json/test_1_combination.json"); // Update the path as needed

        // // if (!response.ok) {
        // //   throw new Error(`HTTP error! status: ${response.status}`);
        // // }

        // const data = await response.json();
        // console.log("백엔드에서 전달되는 데이터 : ", data);

        // // ResultFromModel 추출 (ML 서버에서 온 결과)
        // const resultData = data.ResultFromModel;

        // // ResultDescriptionFromLLM.content 추출 (보고서의 해석 파트)
        // const explanationContent =
        //   data.ResultDescriptionFromLLM?.choices?.[0]?.message?.content;

        // if (!explanationContent) {
        //   throw new Error("Missing explanation content in the response.");
        // }

        // let explanationData;
        // try {
        //   explanationData = JSON.parse(explanationContent);
        // } catch (parseError) {
        //   console.error("Failed to parse explanation content:", parseError);
        //   throw new Error("Invalid JSON format in explanation content.");
        // }
        // console.log("Parsed explanation data:", explanationData);

        // 최종 데이터 저장 및 전달
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
        // <SupporVectorVisualization
        //   result={jsonResult.result}
        //   explanation={jsonExplanation.result}
        // />
      //   <NeuralNetworkVisualization
      //   result={jsonResult.result}
      //   explanation={jsonExplanation.result}
      // />
      )}
    </div>
  );
}
