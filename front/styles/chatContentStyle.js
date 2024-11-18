
const styles = {
    chatContainer: {
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100vh",
        justifyContent: 'center',
        transition: 'transform 0.5s ease'
    },
    fullScreenChat: {
        width: '70%',
        transition: "width 0.5s ease", 
        transformOrigin: "left",        
        transform: "scaleX(1)",
        height: '100vh',
        overflowY: "auto",
        scrollbarWidth: 'none',
    },
    leftSection: {
        width: '40%',
        borderRight: "1px solid #ddd",
        overflowY: "auto",
        scrollbarWidth: 'none',
        transition: "width 0.5s ease",
        paddingBottom: '200px'
    },
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
        cursor: 'pointer',
    },
    inputContainerLeft: {
        display: 'flex',
        padding: '20px',
        marginLeft: '40px',
        backgroundColor: '#fff',
        width: '30%',
        position: 'fixed',
        bottom: 0,
        zIndex: 1000,
        boxSizing: 'border-box',
        backgroundColor: 'transparent'
    },
    rightSection: {
        overflow: 'hidden',
        width: "60%", 
        height: '100vh',          
        transition: "width 0.5s ease",
        position: "relative",
    },
    chatWindow: {
        flex: 1,
        padding: "50px",
        backgroundColor: "white",
        width: '100%',
        maxHeight: '100vh',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        paddingBottom: '150px'
    },
    img: {
        width: '25px',
        marginRight: '10px',
        padding: '10px'
    },
    pdfImg: {
        width: '30px',
        cursor: 'pointer',
        marginLeft: '10px'
    },
    file: {
        display: 'flex',                
        alignItems: 'flex-end',       
        marginBottom: '10px',          
        padding: '15px', 
        paddingRight: '20px',
        border: '1px solid #d7c6fa',           
        borderRadius: '10px',
        width: 'fit-content',
        marginLeft: 'auto',
        cursor: 'pointer',
        maxWidth: '100%',
        wordBreak: 'break-word',
        gap: '10px'
    },
    user: {
        display: 'flex',                
        flexDirection: 'column',        
        alignItems: 'flex-end',       
        marginBottom: '10px',          
        backgroundColor: '#d7c6fa',     
        padding: '15px',            
        borderRadius: '10px',
        width: 'fit-content',
        marginLeft: 'auto'
    },
    serverContainer: {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginBottom: '10px'
    },
    icon: {
        width: '60px'
    },
    server: {
        display: 'flex',
        flexDirection: 'column',        
        marginBottom: '10px',
        backgroundColor: '#f0f0f0',    
        padding: '15px',
        borderRadius: '10px',
        width: 'fit-content',
        cursor: 'pointer',
        fontWeight: 'bold',
        margin: 0
    },
    conversation: {
        display: 'flex',
        flexDirection: 'column',        
        marginBottom: '10px',
        backgroundColor: '#f0f0f0',    
        padding: '15px',
        borderRadius: '10px',
        width: 'fit-content',
        cursor: 'pointer',
        margin: 0,
        whiteSpace: 'pre-wrap'
    },
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        padding: '5px 10px',
        color: 'black',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer'
    },
    resultContent: {
        width: '100%',
        textAlign: "center",
        overflowY: 'auto',
        maxHeight: '100vh',
        scrollbarWidth: 'none', 
    },
    otherModelTitleContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
    },
    otherModelContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px'
    },
    modelCard: {
        border: '1px solid #9370db',
        borderRadius: '1rem',
        background: 'linear-gradient(120deg, #dec1de 20%, #d9c5d9 50%, #d9ccd9 80%)',
        color: '#6c4e82',
        padding: '10px',
        cursor: 'pointer',
        maxWidth: '150px',
        wordWrap: 'break-word',
        wordBreak: 'break-all',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        textAlign: 'center',
        padding: '15px',
        fontWeight: 'bold'
    },  
    imgContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid #9370db',
        borderRadius: '12px',
        cursor: 'pointer',
        marginTop: '10px',
        '&:hover': {
            transform: 'scale(1.05)'
        }
    },
    img: {
        width: '30px',
        marginLeft: '10px'
    },
    modelCardHover: {
        transform: 'scale(1.05)', 
        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)', 
    }
}

export default styles;