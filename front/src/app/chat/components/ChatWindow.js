import styles from "/styles/chatWindowStyle"; // JavaScript 파일 import

export default function Home() {
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
            <div style={styles.contentContainer}>
                <div style={styles.messageBox}>
                    <span style={styles.message}>분석할 파일과 요구사항을 입력해주세요.</span>
                </div>
                <div style={styles.inputWrapper}>
                    <div style={styles.inputContainer}>
                        <input 
                            type="text" 
                            style={styles.input} 
                            placeholder="메시지를 입력해주세요." 
                        />
                        <button 
                            style={styles.inputButton} 
                        >
                            전송
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
