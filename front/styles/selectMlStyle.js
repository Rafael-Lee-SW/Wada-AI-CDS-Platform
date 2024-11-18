
const styles = {
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        width: '100vw',
        height: '100vh', 
        overflowY: 'auto', 
        scrollSnapType: 'y mandatory', 
        scrollbarWidth: 'none'
    },
    preContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
        scrollSnapAlign: 'start', 
    },
    modelSelectContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        minHeight: '100vh', 
        boxSizing: 'border-box',
        scrollSnapAlign: 'start', 
        paddingBottom: '50px'
    },
    h2: {
        fontSize: '20px',
        padding: '10px'
    },
    iconContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: '10px',
        paddingRight: '10px',
    },
    iconText: {
        fontSize: '25px',
        fontWeight: 'bold',
    },
    icon: {
        width: '60px',
        padding: '10px'
    },
    otherReplyContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20px',
        paddingBottom: '20px'
    },
    otherReply: {
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
        maxWidth: '70%', // 최대 너비를 부모 요소에 맞추기
        lineHeight: '1.6',
        textAlign: 'center',
        fontSize: '18px',
        color: '#6c4e82'
    },
    replyImg: {
        width: '40px',
        padding: '10px'
    },
    infoBox: {
        padding: '20px'
    },
    cardContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '20px',
        alignItems: 'center',
        paddingBottom: '40px'
    },
    preCardContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: '20px',
        flexWrap: 'wrap',
        padding: '20px'
    },
    preContentContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: '20px',
        flexWrap: 'wrap',
    },
    cardText: {
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#6c4e82',
        marginTop: 0,
        paddingBottom: '15px'
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '15px 20px 20px',
        border: '1px solid #9370db',
        borderRadius: '1rem',
        backgroundColor: 'white',
        width: '300px',
        textAlign: 'center',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        maxHeight: '220px',
        padding: '15px 20px 20px',
    },
    cardContent: {
        textAlign: 'start',
        paddingTop: '10px'
    },
    modelContent: {
        paddingTop: '10px'
    },
    imgContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
    },
    button2Container: {
        marginTop: '25px',
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#9370db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
    },
    button2: {
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#9370db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
    },
    flipCard: {
        backgroundColor: 'transparent',
        width: '300px',
        minHeight: '254px',
        perspective: '1000px',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
    },
    flipCardInner: {
        position: 'relative',
        width: '100%',
        height: '100%',
        textAlign: 'center',
        transition: 'transform 0.8s',
        transformStyle: 'preserve-3d',
        '&:hover': {
            transform: 'rotateY(180deg)', 
        },
    },
    flipCardFront: {
        boxShadow: '0 8px 14px 0 rgba(0,0,0,0.2)',
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center', 
        width: '100%',
        maxHeight: '300px',
        backfaceVisibility: 'hidden',
        border: '1px solid #9370db',
        borderRadius: '1rem',
        background: 'linear-gradient(120deg, rgba(210, 200, 220, 0.7) 20%, rgba(200, 190, 210, 0.7) 50%, rgba(190, 180, 200, 0.7) 80%)',
        color: '#6c4e82',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        boxSizing: 'border-box',
        padding: '15px 20px 20px',
        justifyContent: 'flex-start',
        cursor: 'pointer'
    },
    flipCardBack: {
        boxShadow: '0 8px 14px 0 rgba(0,0,0,0.2)',
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center', 
        width: '100%',
        minHeight: '254px',
        backfaceVisibility: 'hidden',
        border: '1px solid #9370db',
        borderRadius: '1rem',
        background: 'linear-gradient(120deg, #ede7f6 20%, #d1c4e9 50%, #b39ddb 80%)',
        color: '#6c4e82',
        transform: 'rotateY(180deg)',
        padding: '10px',
        overflowY: 'auto', 
        maxHeight: '250px', 
        justifyContent: 'flex-start',
        scrollbarWidth: 'none', 
    },
    reason: {
        padding: '5px',
        textAlign: 'start',
        color: '#481677'
    },
    title1: {
        fontSize: '18px',
        fontWeight: 900,
        margin: 0,
        wordWrap: 'break-word',
        wordBreak: 'break-all',
        whiteSpace: 'normal', 
        color: '#481677',
        padding: '15px 15px',
        paddingBottom: '20px',
        borderBottom: '1px dotted #481677'
    },
    title: {
        fontSize: '18px',
        fontWeight: 900,
        margin: 0,
        padding: '10px'
    },
    notice: {
        width: '100%',
        textAlign: 'center',
        position: 'fixed',
        bottom: '50px',
    },
};

export default styles;