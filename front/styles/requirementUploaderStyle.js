const styles = {
    container: {
        width: '100%',
        height: '100vh', 
        display: 'flex',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center', 
        backgroundColor: 'white' 
    },
    inputContainer: {
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        width: '50%',
        maxWidth: '600px'
    },
    input: {
        flex: 1,
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '10px',
        marginRight: '10px',
        outline: 'none',
        fontSize: '16px'
    },
    inputButton: {
        cursor: 'pointer',
        width: 'auto',
        padding: '5px 10px',
        height: '45px',
        backgroundColor: '#fdfaff', 
        color: 'black',
        border: '1px solid #9370db',
        borderRadius: '10px',
        transition: 'background-color 0.3s ease',
    },
    inputButtonHover: {
        backgroundColor: '#45a049' 
    }
}

export default styles;
