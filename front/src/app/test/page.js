// src/app/test/page.js

'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const KMeansVisualization = dynamic(
    () => import("../chat/components/analyzeReport/KMeansVisualization.js"),
    { ssr: false, loading: () => <p>Loading visualization...</p> }
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
                const [resultResponse, explanationResponse] = await Promise.all([
                    // fetch("/json/test_6.json"),
                    // fetch("/json/test_6_explanation.json"),
                    fetch("/json/test_5.json"),
                    fetch("/json/test_5_explanation.json"),
                ]);

                if (!resultResponse.ok || !explanationResponse.ok) {
                    throw new Error(`HTTP error! status: ${resultResponse.status} and ${explanationResponse.status}`);
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
                <KMeansVisualization
                    result={jsonResult.result}
                    explanation={jsonExplanation.result}
                />
            )}
        </div>
    );
}
