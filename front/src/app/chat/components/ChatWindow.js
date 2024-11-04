"use client"

import styles from "/styles/chatWindowStyle"; 
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"
import DefaultPage from "./DefaultPage";
import SelectML from "./SelectML";
import ChatContent from "./ChatContent";

export default function Home() {

    const [submittedFile, setSubmittedFile] = useState(null);
    const [submittedMessage, setSubmittedMessage] = useState('');   
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [page, setPage] = useState('default');
    const [models, setModels] = useState([]);
    const [purpose, setPurpose] = useState();
    const [overview, setOverview] = useState();
    const [result, setResult] = useState(null);
    const [chatRoomId, setChatRoomId] = useState('');
    const [sessionId, setSessionId] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]); 
    };

    const handleMessage = (event) => {
        setMessage(event.target.value); 
    }

    const handleSubmit = async (event) => {
        event.preventDefault(); 

        setSubmittedFile(file);
        setSubmittedMessage(message);
        setChatRoomId(uuidv4())
        setSessionId(uuidv4());
        const formData = new FormData();

        formData.append("file", file); 
        formData.append("message", message); 

        // api 연결 필요
        try {
            const response = await fetch("요청api", {
                method: "POST",
                body: formData, 
                headers: {
                'sessionId': sessionId
                }
            });
            
            // 테스트용
            const result = {
                "purpose_understanding": {
                    "main_goal": "환경 데이터를 통한 온실가스 배출량에 영향을 미치는 주요 요인을 파악하고, 국가별 특성을 고려한 의미있는 인사이트를 도출하고자 합니다.",
                    "specific_requirements": [
                        "국가별 총 배출량(total_emission)에 영향을 미치는 주요 요인 파악",
                        "인구 구조와 배출량의 상관관계 분석",
                        "농업 활동과 산업 활동이 배출량에 미치는 영향 분석",
                        "유사한 특성을 가진 국가들의 그룹화"
                    ],
                    "expected_outcomes": [
                        "배출량 예측 모델을 통한 주요 영향 요인 식별",
                        "국가별 특성에 따른 군집화 결과와 각 군집의 특징",
                        "배출량 감소를 위한 실질적인 정책 제안 근거 도출"
                    ]
                },
                "data_overview": {
                    "structure_summary": "이 데이터셋은 다양한 국가의 연간 온실가스 배출 관련 지표를 포함하고 있으며, 인구 통계, 농업 활동, 산업 활동, 그리고 환경 관련 변수들로 구성되어 있습니다.",
                    "key_characteristics": [
                        "다양한 배출원별 세부 데이터 포함 (농업, 산업, 생활 등)",
                        "인구 구조 데이터 포함 (도시/농촌, 성별)",
                        "온도 데이터를 통한 환경 요인 고려",
                        "국가별, 연도별 데이터 구조"
                    ],
                    "relevant_columns": [
                        "total_emission - 총 배출량으로 주요 분석 대상",
                        "Rural population, Urban population - 인구 구조 특성",
                        "Food Processing, Fertilizers Manufacturing, IPPU - 산업 활동 지표",
                        "Forest fires, Savanna fires, Crop Residues - 농업 및 산림 관련 지표"
                    ]
                },
                "model_recommendations": [
                    {
                        "model_name": "배출량 예측을 위한 랜덤 포레스트 회귀 모델",
                        "selection_reasoning": "랜덤 포레스트 회귀 모델을 선택한 이유는 다음과 같습니다: 1) 다양한 변수들 간의 복잡한 상호작용을 잘 포착할 수 있습니다. 2) 변수 중요도를 통해 배출량에 영향을 미치는 주요 요인을 파악할 수 있습니다. 3) 이상치에 강건하며 비선형적 관계도 잘 모델링할 수 있습니다.",
                        "implementation_request": {
                            "model_choice": "random_forest_regression",
                            "feature_columns": [
                                "Rural population",
                                "Urban population",
                                "Food Processing",
                                "Fertilizers Manufacturing",
                                "IPPU",
                                "Forest fires",
                                "Savanna fires",
                                "Crop Residues",
                                "Average Temperature °C"
                            ],
                            "target_variable": "total_emission"
                        }
                    },
                    {
                        "model_name": "국가 특성 기반 군집 분석",
                        "selection_reasoning": "K-means 군집화를 통해 다음과 같은 인사이트를 얻을 수 있습니다: 1) 유사한 배출 패턴을 가진 국가들을 그룹화할 수 있습니다. 2) 각 군집의 특성을 파악하여 맞춤형 정책 수립의 근거를 마련할 수 있습니다. 3) 벤치마킹할 수 있는 참조 국가군을 식별할 수 있습니다.",
                        "implementation_request": {
                            "model_choice": "kmeans_clustering",
                            "feature_columns": [
                                "total_emission",
                                "Rural population",
                                "Urban population",
                                "Food Processing",
                                "Fertilizers Manufacturing",
                                "IPPU"
                            ],
                            "num_clusters": 4
                        }
                    }
                ]
            }
            console.log("업로드 성공:", result);

            // 추천 모델들, 목적, 요약 저장
            setModels(result.model_recommendations);
            setPurpose(result.purpose_understanding);
            setOverview(result.data_overview);
            setPage('selectML');
            setMessage('');
            setFile(null);

            if (!response.ok) {
                throw new Error("업로드 실패");
            }

            // const result = await response.json();
            console.log("업로드 성공:", result);

            // 추천 모델들, 목적, 요약 저장
            setModels(result.model_recommendations);
            setPurpose(result.purpose_understanding);
            setOverview(result.data_overview);
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
    const handleModelSelect = async (chatRoomId, index) => {
        try {
            const data = {
                "chatRoomId": chatRoomId,
                "selectedModel": index,
            }
            // 요청 방식 확인 필요
            const response = await fetch("요청api", { 
                method: "POST", 
                body: data, 
                headers: {
                'sessionId': sessionId
                }});
            // 분석 결과
            const result = await response.result();

            // 최종 분석 결과 저장
            setResult(result); 
            setPage('chatContent'); 

        } catch (error) {
            // 테스트용 
            setPage('chatContent'); 
            console.error("모델 선택 중 에러 발생:", error);
        }
    };

    return (
        <div style={styles.mainContainer}>
            <div style={styles.sidebar}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                        <img style={styles.profile} src="/img/profile.png" alt="profile" />
                        <span>이한솔</span>
                    </div>
                </div>
                {/* 쿠키에서 대화 기록들 불러오는 api 연결 */}
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
            {page === 'selectML' && <SelectML chatRoomId={chatRoomId} models={models} purpose={purpose} overview={overview} onModelSelect={handleModelSelect} />}
            {/* 채팅 컴포넌트에서 분석결과 탭을 누르면 왼쪽에는 채팅, 오른쪽에는 대시보드가 나오도록 랜더링 */}
            {page === 'chatContent' && <ChatContent file={submittedFile} message={submittedMessage} result={result}/>}

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
