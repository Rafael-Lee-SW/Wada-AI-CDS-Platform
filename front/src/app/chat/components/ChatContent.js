import { useState } from "react";
import styles from "/styles/chatContentStyle";
import Report from "@/app/report/page";

export default function ChatContent({ file, message, result }) {
    const [showResult, setShowResult] = useState(false);

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
            {showResult && (
                <div style={styles.rightSection}>
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div style={styles.resultContent}>
                        <Report result={result}/>
                    </div>
                </div>
            )}
        </div>
    );
}
