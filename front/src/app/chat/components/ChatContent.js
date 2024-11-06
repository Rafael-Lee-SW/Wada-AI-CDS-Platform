import { useState } from "react";
import styles from "/styles/chatContentStyle";
import Importance from "./graphs/Importance";
import Bar from "./graphs/Bar";
import Line from "./graphs/Line";
import Pie from "./graphs/Pie";
import Scatter from "./graphs/Scatter";

export default function ChatContent({ file, message, result }) {
    const [showResult, setShowResult] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [graph, setGraph] = useState("");

    // setGraph(result.graph);

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
                    <div style={styles.file}>
                        <img src="/img/csv.png" style={styles.img}/>
                        <span onClick={handleDownload}>{file.name}</span>
                    </div>
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
                <div style={isExpanded ? styles.rightSectionExpanded : styles.rightSection}>
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div style={styles.resultContent}>
                        {/* 중요도 그래프 */}
                        <Importance result={result}/>
                        {/* 그래프 타입에 따른 컴포넌트 */}
                        {graph === 'bar' && <Bar result={result}/>}
                        {graph === 'line' && <Line result={result}/>}
                        {graph === 'pie' && <Pie result={result}/>}
                        {graph === 'scatter' && <Scatter result={result}/>}
                    </div>
                </div>
            )}
        </div>
    );
}
