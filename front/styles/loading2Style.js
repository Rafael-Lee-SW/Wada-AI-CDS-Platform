const styles = {
    loadingContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vh',
        height: '100vh',
        backgroundColor: 'rgba(240, 240, 240, 0.2)',  
        backdropFilter: 'blur(3px)',  
        zIndex: 100,
    },
    img: {
        width: '100px',
        zIndex: 101,  
    }
}

export default styles;