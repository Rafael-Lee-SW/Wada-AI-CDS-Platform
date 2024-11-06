import styles from "/styles/selectMlStyle";
import { useState } from "react";

export default function SelectML({ chatRoomId, models, purpose, overview, onModelSelect }) {
    const [hoveredIndex, setHoveredIndex] = useState();
    const [showModelSelection, setShowModelSelection] = useState(false); 
    const [isHovered, setIsHovered] = useState(false);

    const handleModelClick = (chatRoomId, index) => {
        onModelSelect(chatRoomId, index); 
    };

    const handleSelectButtonClick = () => {
        setShowModelSelection(true); 
    };

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
                            <h3>{overview.structure_summary}</h3>
                        </div>
                        <div style={styles.card}>
                            <p style={styles.cardText}>예상 분석 목적</p>
                            <h4>{purpose.main_goal}</h4>
                        </div>
                    </div>
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
                        모델 선택하기
                    </button>
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
                            const reason = model.selection_reasoning
                                 
                            return (
                                <div 
                                    key={index} 
                                    style={styles.flipCard}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    onClick={() => handleModelClick(chatRoomId, index)}
                                >
                                    <div style={{
                                        ...styles.flipCardInner,
                                        transform: hoveredIndex === index ? 'rotateY(180deg)' : 'none',
                                    }}>
                                        <div style={styles.flipCardFront}>
                                            <p style={styles.title}>{model.analysis_name}</p>
                                        </div>
                                        <div style={styles.flipCardBack}>
                                            <p style={styles.title}>기대 결과</p>
                                            <p style={styles.reason}>{reason}</p>
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