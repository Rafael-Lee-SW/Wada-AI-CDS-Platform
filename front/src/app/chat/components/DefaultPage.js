import styles from "/styles/defaultPageStyle";
import { useState, useEffect } from "react";

export default function DefaultPage() {
    const [displayText, setDisplayText] = useState(""); 
    const [index, setIndex] = useState(0); 

    const text = "분석할 파일과 요구사항을 입력해주세요."; 
    const speed = 80; 

    useEffect(() => {
        if (index < text.length) {
            const timeoutId = setTimeout(() => {
                setDisplayText((prev) => prev + text.charAt(index));
                setIndex(index + 1); 
            }, speed);

            // cleanup function to clear timeout if component unmounts or updates
            return () => clearTimeout(timeoutId);
        }
    }, [index, text]); 

    return (
        <div style={styles.contentContainer}>
            <div style={styles.messageBox}>
                <img src="/img/motion.gif" style={styles.logoImg} />
                <span style={styles.message}>{displayText}</span>
            </div>
        </div>
    );
}
