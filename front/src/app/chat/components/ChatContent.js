import { useState } from "react";
import styles from "/styles/chatContentStyle";

export default function ChatContent({ file, message }) {
    const [showResult, setShowResult] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

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
        setShowResult(true); // 화면 분할 상태 활성화
    };

    const handleCloseDashBoard = () => {
        setShowResult(false); // 결과 창 닫기
        setIsExpanded(false); // 확장 상태 해제
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
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
                    <div>
                        <span onClick={handleResultClick} style={styles.server}>
                            분석 결과를 보려면 여기를 클릭하세요.
                        </span>  
                    </div>
                </div>
            </div>

            {/* 오른쪽 분석 결과 창 */}
            {showResult && (
                <div style={isExpanded ? styles.rightSectionExpanded : styles.rightSection}>
                    <button onClick={toggleExpand} style={styles.expandButton}>
                        {isExpanded ? "축소" : "확장"}
                    </button>
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div style={styles.resultContent}>
                        <p>분석 결과 화면입니다.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
