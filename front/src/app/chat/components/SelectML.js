import styles from "/styles/selectMlStyle";

export default function SelectML({ models, onModelSelect }) {
    const handleModelClick = (model) => {
        onModelSelect(model); 
    };

    return (
        <div style={styles.container}>
            <h2>머신 러닝 모델을 선택해주세요.</h2>
            <div style={styles.cardContainer}>
                {models.map((model, index) => (
                    <div key={index} style={styles.card} onClick={() => handleModelClick(model)}>
                        <h3>{model.name}</h3>
                        <p>{model.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
