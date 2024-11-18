const styles = {
    chatContainer: {
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100%",
        justifyContent: 'center'
    },
    fullScreenChat: {
        width: '70%',
        transition: "width 0.5s ease", 
        transformOrigin: "left",        
        transform: "scaleX(1)",
        height: '100%',
        overflowY: "hidden",
    },
    leftSection: {
        width: '50%',
        borderRight: "1px solid #ddd",
        overflowY: "hidden",
        transition: "width 0.5s ease",
    },
    rightSection: {
        overflow: 'hidden',
        marginTop: '50px',
        width: "50%",            
        transition: "width 0.5s ease",
        position: "relative",
    },
    chatWindow: {
        flex: 1,
        padding: "50px",
        backgroundColor: "white",
        width: '100%',
        height: '100%',
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
    expandButton: {
        position: "absolute",
        top: 10,
        right: 45,
        padding: '5px 10px',
        backgroundColor: '#d3d3d3',
        color: 'black',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer'
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
        padding: "20px",
        height: "100%",
        textAlign: "center",
    },
}

export default styles;