import styles from "/styles/components/inputChatStyle";
import { useState } from "react";

export default function InputChat({ chatRoomId, requestId, onReSubmit }) {
    const [inputValue, setInputValue] = useState('');

    const handleMessage = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendClick = () => {
        onReSubmit(inputValue, chatRoomId, requestId);
        setInputValue(''); 
    };

    return (
        <div style={styles.inputContainer}>
            <input 
                type="text" 
                style={styles.input} 
                placeholder="원하는 결과가 없다면 추가 요구사항을 입력해주세요." 
                value={inputValue}
                onChange={handleMessage}
            />
            <img src="/img/inputButton.png" style={styles.inputImg} onClick={handleSendClick}/>
        </div>
    );
}
