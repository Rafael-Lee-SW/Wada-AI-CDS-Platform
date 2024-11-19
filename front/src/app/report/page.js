// src/app/test/page.js

"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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

  const reportRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) {
      return;
    }

    try {
      setIsGenerating(true);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, 
        useCORS: true, 
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const pdfImgHeight = pdfWidth / ratio;

      let heightLeft = pdfImgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfImgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfImgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save("simulated_Factory_Impact_Data.pdf");
    } catch (error) {
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
        const data = result;
        const resultData = data.resultFromModel;
        setModel(resultData.model);
      
        const explanationContent =
          data.resultDescription?.choices?.[0]?.message?.content;

        if (!explanationContent) {
          throw new Error("Missing explanation content in the response.");
        }

        let explanationData;
        try {
          explanationData = JSON.parse(explanationContent);
        } catch (parseError) {
          throw new Error("Invalid JSON format in explanation content.");
        }

        setJsonResult(resultData);
        setJsonExplanation(explanationData);
      } catch (err) {
        setError("Failed to load analysis results.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);



  return (
    <div>
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
