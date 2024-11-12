import { useState } from "react";
import styles from "/styles/chatContentStyle";
import Bar from "./graphs/Bar";
import Line from "./graphs/Line";
import Pie from "./graphs/Pie";
import Scatter from "./graphs/Scatter";
import Table from "./graphs/Table";
import LogisticRegressionVisualization from "./analyzeReport/LogisticsRegressionVisualization";
import ClassifierVisualization from "./analyzeReport/RandomForestClassifierVisualization";

export default function ChatContent({ file, message, result }) {
    const [showResult, setShowResult] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const model = result.ResultFromModel.model;

    const handleDownload = () => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;  
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 
    };

    const handleResultClick = () => {
        setShowResult(true); 
    };

    const handleCloseDashBoard = () => {
        setShowResult(false); 
        setIsExpanded(false); 
    };

    return (
        <div style={styles.chatContainer}>
            {/* 왼쪽 채팅창 */}
            <div style={showResult ? styles.leftSection : styles.fullScreenChat}>
                <div style={styles.chatWindow}>
                    {file.map((fileItem, index) => (
                        <div key={index} style={styles.file}>
                            <img src="/img/csv.png" style={styles.img} alt="file icon" />
                            <span onClick={() => handleDownload(fileItem)}>{fileItem.name}</span>
                        </div>
                    ))}
                    <div style={styles.user}>
                        <span>{message}</span>
                    </div>
                    <div style={styles.serverContainer}>
                        <img src="/img/icon.png" alt="logo" style={styles.icon}/>
                        <span onClick={handleResultClick} style={styles.server}>
                            분석 결과를 보려면 여기를 클릭하세요.
                        </span>  
                    </div>
                </div>
            </div>

            {/* 오른쪽 분석 결과 창 */}
            {showResult && (
                <div style={styles.rightSection}>
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div style={styles.resultContent}>
                        {model === 'LogisticRegressionBinary' && <LogisticRegressionVisualization result={result}/>}
                        {model === 'RandomForestClassifier' && <ClassifierVisualization result={result}/> }
                        {model === 'RandomForestRegression' && <renderFeatureImportances result={result}/> }
                        {/* {graph.graph_type === 'bar' && <Bar graph={graph}/>}
                        {graph.graph_type === 'line' && <Line graph={graph}/>}
                        {graph.graph_type === 'pie' && <Pie graph={graph}/>}
                        {graph.graph_type === 'scatter' && <Scatter graph={graph}/>} */}
                    </div>
                </div>
            )}
        </div>
    );
}
