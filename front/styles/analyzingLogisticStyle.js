// src/styles/analyzingLogisticStyle.js

import { makeStyles } from '@mui/styles';

const useAnalyzingLogisticStyles = makeStyles({
  container: {
    padding: '40px 20px',
    background: '#f5f7fa', // Light gray background for better contrast
    minHeight: '100vh',
  },
  reportTitle: {
    fontFamily: 'Poppins, sans-serif', // Modern sans-serif font
    fontWeight: 700,
    color: '#1a202c', // Darker slate color
    marginBottom: '50px',
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    color: '#2d3748',
    marginBottom: '25px',
    borderBottom: '3px solid #2b6cb0', // Accent underline in blue
    display: 'inline-block',
    paddingBottom: '5px',
  },
  bodyText: {
    fontFamily: 'Roboto, sans-serif',
    color: '#4a5568', // Grayish color for better readability
    marginBottom: '25px',
    lineHeight: 1.8,
    fontSize: '1rem',
  },
  card: {
    marginBottom: '25px',
    borderRadius: '12px',
    background: '#ffffff', // White background for clarity
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Subtle shadow for depth
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
    color: '#2b6cb0', // Strong blue color
    marginBottom: '10px',
  },
  cardSubtitle: {
    fontFamily: 'Roboto, sans-serif',
    color: '#718096', // Lighter gray for subtitles
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
    marginBottom: '50px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
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
      backgroundColor: '#ebf8ff', // Light blue hover
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
