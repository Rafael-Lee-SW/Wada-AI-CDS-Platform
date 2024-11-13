const styles = {
    inputContainer: {
        display: 'flex',
        padding: '20px',
        backgroundColor: '#fff',
        width: '50%',
        position: 'fixed',
        bottom: 0,
        zIndex: 1000,
        boxSizing: 'border-box',
        backgroundColor: 'transparent'
    },
    input: {
        flex: 1,
        paddingLeft: '20px', 
        paddingTop: '5px',
        paddingBottom: '5px',
        border: '1px solid #ccc',
        borderRadius: '10px',
        marginRight: '5px',
        height: '40px'
    },
    inputImg: {
        width: '40px',
        cursor: 'pointer'
    },
    fileInput: {
        display: 'none'
    },
    fileImg: {
        position: 'relative',
        left: '47px',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        width: '50px',
        paddingTop: "10px",
        paddingRight: "15px",
        paddingBottom: "10px",
        paddingLeft: "15px"
    },
    inputButton: {
        cursor: 'pointer',
        width: '40px',
        height: '40px',
        marginTop: '3px'
    },
};

export default styles;
