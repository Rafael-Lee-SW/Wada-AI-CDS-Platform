import styles from "/styles/loadingStyle";

export default function Loading() {
    return (
        <div style={styles.loadingContainer}>
            <img
            src="/img/motion.gif"
            alt="motionLogo"
            style={styles.img}
            />
        </div>
    )
}