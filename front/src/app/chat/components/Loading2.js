import styles from "/styles/loading2Style";

export default function Loading2() {
    return (
        <div style={styles.loadingContainer}>
            <img
            src="/img/motion.gif"
            alt="motionLogo"
            style={styles.img}
            />
            <p>답변을 기다리는 중입니다.</p>
        </div>
    );
}