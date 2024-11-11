import styles from "/styles/selectMlStyle";
import { useState } from "react";

export default function SelectML({ chatRoomId, models, purpose, overview, requestId, onModelSelect, onSubmit }) {
    const [hoveredIndex, setHoveredIndex] = useState();
    const [showModelSelection, setShowModelSelection] = useState(false); 
    const [isHovered, setIsHovered] = useState(false);

    const handleModelClick = (chatRoomId, model, requestId) => {
        console.log(requestId);
        onModelSelect(chatRoomId, model, requestId); 
    };

    const handleSelectButtonClick = () => {
        console.log(models);
        setShowModelSelection(true); 
    };

    const handleSubmit = () => {
        onSubmit();
    }

    return (
        <div style={styles.container}>

            {!showModelSelection && (
                <><div style={styles.iconContainer}>
                        <img 
                            src="/img/news.gif" 
                            alt="icon"
                            style={styles.icon} 
                        />
                        <p style={styles.iconText}>사전 분석</p>
                    </div>
                    <div style={styles.preCardContainer}>
                        <div style={styles.card}>
                            <p style={styles.cardText}>데이터 요약</p>
                            <h3 style={styles.cardContent}>{overview.structure_summary}</h3>
                        </div>
                        <div style={styles.card}>
                            <p style={styles.cardText}>예상 분석 목적</p>
                            <h4 style={styles.cardContent}>{purpose.main_goal}</h4>
                        </div>
                    </div>
                    <p style={{ padding: '10px', fontWeight: 'bold' }}>이대로 분석을 진행할까요?</p>
                    <div style={styles.buttonContainer}>
                        <button
                            style={{
                                ...styles.button,
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                transition: 'transform 0.3s', 
                            }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={handleSelectButtonClick}
                        >
                            O
                        </button>
                        <button
                            style={{
                                ...styles.button,
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                transition: 'transform 0.3s', 
                            }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={handleSubmit}
                        >
                            X
                        </button>
                    </div>
                </>
            )}

            {/* 모델 선택 화면 */}
            {showModelSelection && (
    <div style={styles.modelSelectContainer}>
        <div style={styles.iconContainer}>
            <img 
                src="/img/cursor.gif" 
                alt="icon"
                style={styles.icon} 
            />
            <p style={styles.iconText}>모델을 선택해주세요.</p>
        </div>
        <div style={styles.cardContainer}>
            {models.map((model, index) => {
                const reason = model.selection_reasoning;

                return (
                    <div 
                        key={index} 
                        style={styles.flipCard}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => handleModelClick(chatRoomId, model, requestId)}
                    >
                        <div style={{
                            ...styles.flipCardInner,
                            transform: hoveredIndex === index ? 'rotateY(180deg)' : 'none',
                        }}>
                            <div style={styles.flipCardFront}>
                                <p style={styles.title1}>{model.analysis_name}</p>
                                {/* "예상되는 분석 결과"를 출력 */}
                                <p style={styles.reason}>{reason["예상되는 분석 결과"]}</p>
                            </div>
                            <div style={styles.flipCardBack}>
                                {/* <p style={styles.title}>기대 결과</p>
                                {/* "모델 선택의 이유"를 출력 */}
                                {/* <p style={styles.reason}>{reason["모델 선택의 이유"]}</p>  */}
                                
                                {/* selection_reasoning의 다른 항목들을 출력 */}
                                {Object.entries(reason).map(([key, value]) => (
                                    <div key={key}>
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
    </div>
)}

        </div>
    );
}