import styles from "/styles/newChatStyle";
import { useState, useEffect } from "react";

export default function NewChat() {
    const [displayText, setDisplayText] = useState(""); 
    const [index, setIndex] = useState(0); 

    const text = "새로운 채팅을 시작해주세요."; 
    const speed = 50; 

    useEffect(() => {
        if (index < text.length) {
            const timeoutId = setTimeout(() => {
                setDisplayText((prev) => prev + text.charAt(index));
                setIndex(index + 1); 
            }, speed);

            return () => clearTimeout(timeoutId);
        }
    }, [index, text]); 

    return (
        <div style={styles.contentContainer}>
            <div style={styles.messageBox}>
                <span style={styles.message}>{displayText}</span>
            </div>
        </div>
    );
}
