const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        backgroundColor: 'white',
        width: '100%'
    },
    h2: {
        fontSize: '30px',
        padding: '10px'
    },
    infoBox: {
        padding: '10px'
    },
    cardContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '20px',
    },
    card: {
        padding: '20px',
        width: '200px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        cursor: 'pointer'
    },
};

export default styles;