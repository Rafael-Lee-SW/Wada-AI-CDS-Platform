import styles from "/styles/selectMlStyle";

export default function SelectML({ chatRoomId, models, purpose, overview, onModelSelect }) {

    const handleModelClick = (chatRoomId, index) => {
        onModelSelect(chatRoomId, index); 
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.h2}>머신 러닝 모델을 선택해주세요.</h2>
            <div style={styles.infoBox}>
                <h3>{overview.structure_summary}</h3>
                <h4>{purpose.main_goal}</h4>
            </div>
            <div style={styles.cardContainer}>
                {models.map((model, index) => (
                    <div key={index} style={styles.card} onClick={() => handleModelClick(chatRoomId, index)}>
                        <h3>{model.model_name}</h3>
                        <p>{model.selection_reasoning}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
