const styles = {
    mainContainer: {
        display: 'flex',
        height: '100vh',
        backgroundColor: 'white',
    },
    sidebar: {
        width: '250px',
        backgroundColor: '#fff',
        padding: '5px 10px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        zIndex: '2'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
    },
    avatar: {
        display: 'flex',
        alignItems: 'center',
        marginRight: '10px',
    },
    profile: {
        width: '30px',
        margin: '10px'
    },
    menu: {
        marginTop: '20px',
    },
    menuItemTitle: {
        backgroundColor: '#d3d3d3',
        display: 'flex',
        justifyContent: 'center',
        borderRadius: '12px',
        padding: '10px',
        margin: '10px'
    },
    menuItem: {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    },
    arrow: {
        width: '20px',
        margin: '10px'
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
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    },
    headerMessage: {
        paddingLeft: '270px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1a4682'
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
        marginBottom: '10px',
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
        paddingLeft: '220px',
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
        marginRight: '10px',
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
        padding: '10px 20px',
        backgroundColor: '#d3d3d3',
        color: 'black',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
    },
};

export default styles;
