"use client"

import styles from "/styles/chatWindowStyle"; 
import { useState } from "react";
import DefaultPage from "./DefaultPage";
import SelectML from "./SelectML";
import ChatContent from "./ChatContent";
import DashBoard from "./DashBoard";

export default function Home() {

    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [page, setPage] = useState('default');
    const [models, setModels] = useState();
    const [result, setResult] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]); 
    };

    const handleMessage = (event) => {
        setMessage(event.target.value); 
    }

    const generateSessionKey = () => {
        return `${Math.random().toString(36).substr(2, 9)}${Date.now()}`;
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); 
        const formData = new FormData();
        const sessionKey = generateSessionKey(); 

        formData.append("file", file); 
        formData.append("message", message); 
        formData.append("sessionKey", sessionKey);

        try {
            const response = await fetch("요청api", {
                method: "POST",
                body: formData, 
            });

            if (!response.ok) {
                throw new Error("업로드 실패");
            }

            const result = await response.json();
            console.log("업로드 성공:", result);

            setModels(result);
            setPage('selectML');
            setMessage('');
            setFile(null);

        } catch (error) {
            console.error("에러 발생:", error);

            setMessage(''); 
            setFile(null);
        }
    };

    const handleFileRemove = () => {
        setFile(null);
    }

    // selectMl 에서 선택된 모델로 분석 요청
    const handleModelSelect = async (selectedModel) => {
        try {
            // 요청 방식 수정 필요
            const response = await fetch("요청api", { method: "POST", body: JSON.stringify({ model: selectedModel }) });
            const result = await response.json();

            // 최종 분석 결과 저장
            setResult(result); 
            setPage('chatContent'); 

        } catch (error) {
            console.error("모델 선택 중 에러 발생:", error);
        }
    };

    const handleMakeDashBoard = (result) => {
        // result 를 받았을 때 어떻게 채팅페이지와 대시보드를 함께 보여줄것인지 고민
    }

    return (
        <div style={styles.mainContainer}>
            <div style={styles.sidebar}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                        <img style={styles.profile} src="/img/profile.png" alt="profile" />
                        <span>이한솔</span>
                    </div>
                </div>
                <div style={styles.menu}>
                    <div style={styles.menuItemTitle}>
                        <p>분석 기록</p>
                    </div>
                    <div style={styles.menuItem}>
                        <img style={styles.arrow} src="/img/arrow.png" alt="arrow"/>
                        <p>분석 기록 1</p>
                    </div>
                    <div style={styles.menuItem}>
                        <img style={styles.arrow} src="/img/arrow.png" alt="arrow"/>
                        <p>분석 기록 2</p>
                    </div>
                    <div style={styles.menuItem}>
                        <img style={styles.arrow} src="/img/arrow.png" alt="arrow"/>
                        <p>분석 기록 3</p>
                    </div>
                </div>
            </div>
            <div style={styles.header}>
                <span style={styles.headerMessage}>원하는Da로</span>
            </div>

            {page === 'default' && <DefaultPage />}
            {page === 'selectML' && <SelectML models={models} onModelSelect={handleModelSelect} />}
            {/* 채팅 컴포넌트에서 분석결과 탭을 누르면 왼쪽에는 채팅, 오른쪽에는 대시보드가 나오도록 랜더링 */}
            {page === 'chatContent' && <ChatContent result={result} onMakeDashBoard={handleMakeDashBoard}/>}
            {page === 'dashBoard' && <DashBoard result={result}/>}

            <div style={styles.inputWrapper}>
                {file && (
                    <div style={styles.fileDisplay}>
                        <span>{file.name}</span>
                        <button 
                            type="button" 
                            onClick={handleFileRemove} 
                            style={styles.removeButton} 
                        >
                            X
                        </button>
                    </div>
                )}

                <div style={styles.inputContainer}>
                    <label htmlFor="file-upload">
                        <img src="/img/fileupload.png" style={styles.fileImg} alt="파일 업로드"/>
                    </label>
                    <input 
                        id="file-upload"
                        type="file" 
                        style={styles.fileInput}
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                    <input 
                        type="text" 
                        style={styles.input} 
                        placeholder="메시지를 입력해주세요." 
                        value={message}
                        onChange={handleMessage}
                    />
                    <button 
                        type="submit"
                        style={styles.inputButton} 
                        onClick={handleSubmit}
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}
