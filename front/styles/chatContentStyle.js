const styles = {
    chatContainer: {
        display: "flex",
        width: "100vw",
        height: "100%",
    },
    fullScreenChat: {
        width: "100%",
        height: '100%',
        overflowY: "auto",
    },
    leftSection: {
        width: "30%",             
        borderRight: "1px solid #ddd",
        overflowY: "auto",
    },
    rightSection: {
        marginTop: '50px',
        width: "60%",            
        transition: "width 0.3s ease",
        position: "relative",
    },
    rightSectionExpanded: {
        width: "100%",           
        transition: "width 0.3s ease",
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
        width: '30px',
        margin: '0 10px'
    },
    file: {
        display: 'flex',                
        alignItems: 'flex-end',       
        marginBottom: '10px',          
        padding: '10px', 
        border: '1px solid #d3d3d3',           
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
        backgroundColor: '#e1f5fe',     
        padding: '20px',            
        borderRadius: '10px',
        width: 'fit-content',
        marginLeft: 'auto'
    },
    server: {
        display: 'flex',
        flexDirection: 'column',        
        justifyContent: 'flex-start',
        marginBottom: '10px',
        backgroundColor: '#f0f0f0',    
        padding: '10px',
        borderRadius: '10px',
        width: 'fit-content',
        cursor: 'pointer',
    },
    expandButton: {
        position: "absolute",
        top: 10,
        right: 50,
        padding: "5px 10px",
        cursor: "pointer",
    },
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        padding: "5px 10px",
        cursor: "pointer",
    },
    resultContent: {
        padding: "20px",
        height: "100%",
        textAlign: "center",
    },
}

export default styles;