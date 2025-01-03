
const styles = {
    mainContainer: {
        display: 'flex',
        maxHeight: '100vh',
        backgroundColor: 'white',
        overflowY: 'hidden',
        
    },
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '180px',
        backgroundColor: '#fdfaff',
        padding: '5px 10px',
        borderRight: '1px solid #d3d3d3',
        zIndex: '2',
        maxHeight: '100vh'
    },
    info: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: '15px'
    },
    avatar: {
        display: 'flex',
        alignItems: 'center',
        paddingRight: '20px'
    },
    icon: {
        width: '50px',
    },
    menu: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    menuItemTitle: {
        display: 'flex',
        justifyContent: 'center',
        borderRadius: '12px',
        border: '1px solid #9370db',
        padding: '5px 5px',
        margin: '10px'
    },
    newButtonContainer: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    newButton: {
        fontSize: '14px',
        padding: '10px',
        fontWeight: 'bold'
    },
    chatListContainer: {
        display: 'flex',
        width: '100%',
        maxHeight: '100vh',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflowY: 'auto',
        scrollbarWidth: 'none'
    },
    menuItem: {
        width: '100%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer'
    },
    arrow: {
        width: '20px',
        margin: '10px'
    },
    chatList: {
        fontSize: '15px'
    },
    active: {
        backgroundColor: '#e0e0e0',
    },
    header: {
        backgroundColor: '#fff',
        color: 'black',
        position: 'fixed',
        display: 'flex',
        alignItems: 'center',
        top: 0,
        width: '100%',
        height: '50px',
        borderBottom: '1px solid #d3d3d3'
    },
    headerMessage: {
        fontSize: '16px',
        color: '#545454',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: '#9370db'
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between', 
    },
    actions: {
        cursor: 'pointer',
    },
    messageBox: {
        padding: '20px',
        flex: 1,
        backgroundColor: '#fff',
        boxShadow: '0 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
    },
    logoImg: {
        width: '100px',
        opacity: '0.7'
    },
    message: {
        fontSize: '18px'
    },
    fileDisplay: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    removeButton: {
        background: '#d3d3d3',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        padding: '0 5px',
        marginLeft: '10px'
    },
    inputWrapper: {
        position: 'absolute',
        bottom: 0,
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        padding: '10px',
        paddingLeft: '160px',
        backgroundColor: 'white',
    },
    inputContainer: {
        display: 'flex',
        padding: '20px',
        backgroundColor: '#fff',
        width: '50%'
    },
    input: {
        flex: 1,
        paddingLeft: '40px', 
        paddingTop: '10px',
        paddingBottom: '10px',
        border: '1px solid #ccc',
        borderRadius: '10px',
        marginRight: '5px',
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
