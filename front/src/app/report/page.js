// src/app/test/page.js

"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
// Dynamically import of 보고서 형식들
const KMeansVisualization = dynamic(
  () => import("../chat/components/analyzeReport/KMeansVisualization.jsx"),
  { ssr: false, loading: () => <p>보고서 준비 중입니다...</p> }
);

const LogisticRegressionVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/LogisticsRegressionVisualization.jsx"
    ),
  { ssr: false, loading: () => <p>보고서 준비 중입니다...</p> }
);

const ClassifierVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/RandomForestClassifierVisualization.jsx"
    ),
  { ssr: false, loading: () => <p>보고서 준비 중입니다...</p> }
); // test Case 2

const RegressionVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/RandomForestRegressionVisualization.jsx"
    ),
  { ssr: false, loading: () => <p>보고서 준비 중입니다...</p> }
); // test Case 1

const SVMVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/SupporVectorVisualization.jsx"
    ),
  { ssr: false, loading: () => <p>보고서 준비 중입니다...</p> }
)
const NNVisualization = dynamic(
  () =>
    import(
      "../chat/components/analyzeReport/NeuralNetworkVisualization.jsx"
    ),
  { ssr: false, loading: () => <p>보고서 준비 중입니다...</p> }
)

export default function Report({ result }) {

  const [jsonResult, setJsonResult] = useState(null);
  const [jsonExplanation, setJsonExplanation] = useState(null);
  const [model, setModel] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Reference to the report section to capture
  const reportRef = useRef(null);


  /**
   * Function to handle PDF download
   */
  const handleDownloadPDF = async () => {
    if (!reportRef.current) {
      console.error("Report reference is not set.");
      return;
    }

    try {
      setIsGenerating(true);

      // Use html2canvas to capture the report section
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Enable cross-origin if images are from different origin
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate the number of pages needed
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const pdfImgHeight = pdfWidth / ratio;

      let heightLeft = pdfImgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfImgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - pdfImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfImgHeight);
        heightLeft -= pdfHeight;
      }

      // Save the PDF with the desired filename
      pdf.save("simulated_Factory_Impact_Data.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {

      setIsLoading(true);
      setError(null);
      try {
        /**
         * 과거 테스트 흔적
         */
        // const [resultResponse, explanationResponse] = await Promise.all([
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
        // fetch("/json/test_1.json"), // Regression
        // fetch("/json/test_1_explanation.json"),
        // ]);

        // if (!resultResponse.ok || !explanationResponse.ok) {
        //   throw new Error(
        //     `HTTP error! status: ${resultResponse.status} and ${explanationResponse.status}`
        //   );
        // }

        // const resultData = await resultResponse.json();
        // const explanationData = await explanationResponse.json();

        // console.log("Fetched result data:", resultData);
        // console.log("Fetched explanation data:", explanationData);

        /**
         * 새로운 테스트 데이터(최신)
         */

        // setJsonResult(result);
        const data = result;
        // 여기 수완님 코드 
        // const response = await fetch("/json/test_1_combination.json"); // Update the path as needed

        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }

        // 여기 수완님 코드
        // const data = await response.json();
        console.log("백엔드에서 전달되는 데이터 : ", data);

        const resultData = data.resultFromModel;
        setModel(resultData.model);
        // 여기 수완님 코드
        // ResultFromModel 추출 (ML 서버에서 온 결과)
        // const resultData = data.ResultFromModel;

        // ResultDescriptionFromLLM.content 추출 (보고서의 해석 파트)
        const explanationContent =
          data.resultDescription?.choices?.[0]?.message?.content;

        if (!explanationContent) {
          throw new Error("Missing explanation content in the response.");
        }

        let explanationData;
        try {
          explanationData = JSON.parse(explanationContent);
        } catch (parseError) {
          console.error("Failed to parse explanation content:", parseError);
          throw new Error("Invalid JSON format in explanation content.");
        }
        console.log("Parsed explanation data:", explanationData);

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
      {/* PDF Download Button */}
      {jsonResult && jsonExplanation && (
        <div style={{ textAlign: "left" }}>
          <img
            src="/img/pdf.png"
            onClick={handleDownloadPDF}
            style={{
              padding: "10px 20px",
              width: '80px',
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          />
        </div>
      )}
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
          <div ref={reportRef}>
            {model === 'RandomForestClassifier' && <ClassifierVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'RandomForestRegression' && <RegressionVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'LogisticRegressionBinary' && <LogisticRegressionVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'LogisticRegressionMultinomial' && <LogisticRegressionVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'KmeansClusteringSegmentation' && <KMeansVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'KMeansClusteringAnomalyDetection' && <KMeansVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'NeuralNetworkRegressor' && <NNVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'GraphNeuralNetwork' && <NNVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'SupportVectorMachineClassifier' && <SVMVisualization result={jsonResult} explanation={jsonExplanation} />}
            {model === 'SupportVectorMachineRegressor' && <SVMVisualization result={jsonResult} explanation={jsonExplanation} />}
          </div>
        )}
      </div>
    </div>
  );
}
