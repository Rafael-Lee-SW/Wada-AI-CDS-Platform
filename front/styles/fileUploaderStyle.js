const styles = {
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        gap: '20px'
    },
    error: {
        marginBottom: '5px',
        fontSize: '14px',
        color: 'red'
    },
    input: {
        display: 'none',
    },
    label: {
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontWeight: 'bold'
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
    fileDisplay: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingTop: '10px'
    },
    files: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
    },
    fileName: {
        fontSize: '14px'
    },
    buttonContainer: {
        display: 'flex',
        position: 'relative',
        justifyContent: 'flex-end',
    },
    button: {
        backgroundColor: '#fdfaff',
        border: '1px solid #9370db',
        padding: '5px 10px',
        borderRadius: '10px',
        marginTop: '20px',
    }
}

export default styles;