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
        overflowY: "hidden",
    },
    leftSection: {
        width: '40%',
        borderRight: "1px solid #ddd",
        overflowY: "hidden",
        transition: "width 0.5s ease",
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
        height: '100vh',
        marginTop: '50px',
    },
    img: {
        width: '25px',
        marginRight: '10px'
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
        wordBreak: 'break-word'
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
        alignItems: 'center'
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
}

export default styles;