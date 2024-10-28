const styles = {
    mainContainer: {
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f9f9f9',
    },
    sidebar: {
        width: '250px',
        backgroundColor: '#fff',
        padding: '20px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
    },
    avatar: {
        marginTop: '5px',
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
        marginLeft: '250px',
        padding: '10px 20px',
        paddingLeft: '20px',
        backgroundColor: '#fff',
        color: 'black',
        position: 'fixed',
        display: 'flex',
        alignItems: 'center',
        top: 0,
        width: '100%',
        height: '50px',
        borderBottom: '1px solid gray'
    },
    headerMessage: {
        fontSize: '18px',
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
        justifyContent: 'center'
    },
    inputWrapper: {
        display: 'flex',
        justifyContent: 'center',
        padding: '10px',
        backgroundColor: 'white',
        boxShadow: '2px 0 5px rgba(0,0,0,0.2)'
    },
    inputContainer: {
        display: 'flex',
        padding: '20px',
        backgroundColor: '#fff',
        width: '50%'
    },
    input: {
        flex: 1,
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginRight: '10px',
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
