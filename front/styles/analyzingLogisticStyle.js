// src/styles/analyzingLogisticStyle.js

import { makeStyles } from '@mui/styles';

const useAnalyzingLogisticStyles = makeStyles({
  container: {
    padding: '40px 20px',
    background: '#f5f7fa', 
    minHeight: '100vh',
  },
  reportTitle: {
    fontFamily: 'Poppins, sans-serif', 
    fontWeight: 700,
    color: '#1a202c', 
    marginBottom: '50px',
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    color: '#2d3748',
    marginBottom: '25px',
    borderBottom: '3px solid #2b6cb0', 
    display: 'inline-block',
    paddingBottom: '5px',
  },
  bodyText: {
    fontFamily: 'Roboto, sans-serif',
    color: '#4a5568',
    marginBottom: '25px',
    lineHeight: 1.8,
    fontSize: '1rem',
  },
  card: {
    marginBottom: '25px',
    borderRadius: '12px',
    background: '#ffffff', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
    },
  },
  cardContent: {
    padding: '25px',
  },
  cardTitle: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    color: '#2b6cb0',
    marginBottom: '10px',
  },
  cardSubtitle: {
    fontFamily: 'Roboto, sans-serif',
    color: '#718096', 
    marginBottom: '10px',
    fontStyle: 'italic',
  },
  listItem: {
    fontFamily: 'Roboto, sans-serif',
    color: '#4a5568',
    marginBottom: '10px',
    fontSize: '0.95rem',
  },
  plotContainer: {
    marginBottom: "40px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    backgroundColor: "#ffffff",
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: "20px", 
  },
  dataGrid: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: '#2b6cb0',
      color: '#ffffff',
      fontWeight: 600,
      borderBottom: '2px solid #ffffff',
    },
    '& .MuiDataGrid-cell': {
      color: '#2d3748',
    },
    '& .MuiDataGrid-row:hover': {
      backgroundColor: '#ebf8ff', 
    },
    '& .MuiDataGrid-root': {
      fontFamily: 'Roboto, sans-serif',
    },
  },
  typographyBody2: {
    color: '#4a5568',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginTop: '15px',
  },
});

export default useAnalyzingLogisticStyles;
