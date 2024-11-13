import styles from "/styles/selectMlStyle";
import { useState, useRef } from "react";
import InputChat from "./components/InputChat"; // 새로 추가한 Input 컴포넌트

export default function SelectML({ chatRoomId, models, purpose, overview, requestId, onModelSelect, onSubmit }) {
    const [isHovered1, setIsHovered1] = useState(false);
    const [isHovered2, setIsHovered2] = useState(false);
    const modelSectionRef = useRef(null); // 스크롤 참조를 위한 ref 생성

    // 모델 선택 핸들러
    const handleModelClick = (chatRoomId, requestId, index) => {
        onModelSelect(chatRoomId, requestId, index);
    };

    const handleSubmit = () => {
        onSubmit();
    };

    const handleNext = () => {
        // modelSelectContainer로 스크롤 이동
        if (modelSectionRef.current) {
            modelSectionRef.current.scrollIntoView({
                behavior: 'smooth', // 부드럽게 스크롤
                block: 'start', // 상단에 맞추기
            });
        }
    };

    return (
        <div style={styles.container}>
            {/* 사전 분석 화면 */}
            <div style={styles.preContainer}>
                <div style={styles.iconContainer}>
                    <img src="/img/news.gif" alt="icon" style={styles.icon} />
                    <p style={styles.iconText}>사전 분석</p>
                </div>
                <div style={styles.preCardContainer}>
                    <div style={styles.preContentContainer}>
                        <div style={styles.card}>
                            <p style={styles.cardText}>데이터 요약</p>
                            <h3 style={styles.cardContent}><strong>분석 요청한 파일: </strong>{overview[0].file_name}</h3>
                            <h3 style={styles.cardContent}><strong>요약: </strong>{overview[0].structure_summary}</h3>
                            <h3 style={styles.cardContent}>
                                <strong>관련된 칼럼: </strong>
                                {overview[0].relevant_columns.map((column, index) => (
                                    <span key={index}>{column}{index < overview[0].relevant_columns.length - 1 ? ', ' : ''}</span>
                                ))}
                            </h3>
                        </div>
                        <div style={styles.card}>
                            <p style={styles.cardText}>예상 분석 목적</p>
                            <h4 style={styles.cardContent}><strong>목표: </strong>{purpose.main_goal}</h4>
                            <h4 style={styles.cardContent}><strong>예상되는 결과: </strong>
                                {purpose.expected_outcomes.map((outcome, index) => (
                                    <span key={index}>{outcome}{index < purpose.expected_outcomes.length - 1 ? ', ' : ''}</span>
                                ))}
                            </h4>
                        </div>
                    </div>
                    <p style={{ padding: '10px', fontWeight: 'bold', textAlign: 'center' }}>제가 이해한 내용이 맞나요?</p>
                    <div style={styles.buttonContainer}>
                        <button
                            style={{
                                ...styles.button,
                                transform: isHovered1 ? 'scale(1.05)' : 'scale(1)',
                                transition: 'transform 0.3s',
                            }}
                            onMouseEnter={() => setIsHovered1(true)}
                            onMouseLeave={() => setIsHovered1(false)}
                            onClick={handleNext}
                        >
                            다음 단계
                        </button>
                        <button
                            style={{
                                ...styles.button,
                                transform: isHovered2 ? 'scale(1.05)' : 'scale(1)',
                                transition: 'transform 0.3s',
                            }}
                            onMouseEnter={() => setIsHovered2(true)}
                            onMouseLeave={() => setIsHovered2(false)}
                            onClick={handleSubmit}
                        >
                            다시 분석
                        </button>
                    </div>
                </div>
            </div>

            {/* 모델 선택 화면 */}
            <div ref={modelSectionRef} style={styles.modelSelectContainer}>
                <div style={styles.iconContainer}>
                    <img src="/img/cursor.gif" alt="icon" style={styles.icon} />
                    <p style={styles.iconText}>모델을 선택해주세요.</p>
                </div>
                <div style={styles.Container2}>
                    <div style={styles.cardContainer}>
                        {models.map((model, index) => {
                            const reason = model.selection_reasoning;
                            return (
                                <div
                                    key={index}
                                    style={styles.flipCard}
                                    onClick={() => handleModelClick(chatRoomId, requestId, index)}
                                >
                                    <div style={{
                                        ...styles.flipCardInner,
                                    }}>
                                        <div style={styles.flipCardFront}>
                                            <p style={styles.title1}>{model.analysis_name}</p>
                                            {Object.entries(reason).map(([key, value]) => (
                                                <div style={styles.modelContent} key={key}>
                                                    <p style={styles.title}><strong>{key}</strong></p>
                                                    <p style={styles.reason}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={styles.button2Container}>
                        <button
                            style={{
                                ...styles.button2,
                                transform: isHovered2 ? 'scale(1.05)' : 'scale(1)',
                                transition: 'transform 0.3s',
                            }}
                            onMouseEnter={() => setIsHovered2(true)}
                            onMouseLeave={() => setIsHovered2(false)}
                            onClick={handleSubmit}
                        >
                            모델 다시 추천 받기
                        </button>
                    </div>
                </div>
            </div>
            {/* 하단의 Input Chat 창 */}
            <InputChat/>
        </div>
    );
}
