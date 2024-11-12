const styles = {
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'white',
        minHeight: '100%',
        paddingBottom: '80px',
        transition: 'transform 0.5s ease'
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
        paddingRight: '10px'
    },
    iconText: {
        fontSize: '25px',
        fontWeight: 'bold',
    },
    icon: {
        width: '60px',
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
    },
    preCardContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: '20px',
        flexWrap: 'wrap',
        padding: '20px'
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
        maxHeight: '220px'
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px'
    },
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#9370db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        marginTop: '20px',
    },
    flipCard: {
        backgroundColor: 'transparent',
        width: '250px',
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
        minHeight: '254px',
        backfaceVisibility: 'hidden',
        border: '1px solid #9370db',
        borderRadius: '1rem',
        background: 'linear-gradient(120deg, #dec1de 20%, #d9c5d9 50%, #d9ccd9 80%)',
        color: '#6c4e82',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        boxSizing: 'border-box',
        padding: '10px'
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
        wordBreak: 'keep-all',
    },
    title1: {
        fontSize: '18px',
        fontWeight: 900,
        margin: 0,
        wordWrap: 'break-word',
        wordBreak: 'break-all',
        whiteSpace: 'normal', 
        overflow: 'hidden',
    },
    title: {
        fontSize: '18px',
        fontWeight: 900,
        margin: 0,
        padding: '10px'
    }
};

export default styles;