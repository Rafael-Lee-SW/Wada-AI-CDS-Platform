import styles  from "/styles/defaultPageStyle";

export default function DefaultPage() {
    return (
        <div style={styles.contentContainer}>
            <div style={styles.messageBox}>
                <img src="/img/icon.png" style={styles.logoImg}/>
                <span style={styles.message}>분석할 파일과 요구사항을 입력해주세요.</span>
            </div>
        </div>
    );
}