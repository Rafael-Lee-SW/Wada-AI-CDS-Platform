// src/styles/analyzingKmeansStyle.js

import { makeStyles } from '@mui/styles';

const useAnalyzingKmeansStyles = makeStyles({
  container: {
    padding: '30px',
    background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', // Gradient background
    minHeight: '100vh',
  },
  reportTitle: {
    fontWeight: 700,
    color: '#2D3748', // Dark slate color
    marginBottom: '40px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)', // Subtle text shadow
  },
  sectionTitle: {
    fontWeight: 600,
    color: '#2D3748',
    marginBottom: '20px',
    borderBottom: '3px solid #0D47A1', // Accent underline
    display: 'inline-block',
    paddingBottom: '5px',
  },
  bodyText: {
    color: '#4A5568', // Grayish color for better readability
    marginBottom: '20px',
    lineHeight: 1.8,
    fontSize: '1rem',
  },
  card: {
    marginBottom: '20px',
    borderRadius: '16px',
    background: 'linear-gradient(145deg, #ffffff, #e6e6e6)', // Soft gradient
    boxShadow: '8px 8px 16px #c5c5c5, -8px -8px 16px #ffffff', // Neumorphism effect
    transition: 'transform 0.3s ease, box-shadow 0.3s ease', // Smooth transitions
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '12px 12px 24px #c5c5c5, -12px -12px 24px #ffffff',
    },
  },
  cardContent: {
    padding: '20px',
  },
  cardTitle: {
    fontWeight: 600,
    color: '#0D47A1', // Strong accent color
    marginBottom: '10px',
  },
  cardSubtitle: {
    color: '#718096', // Lighter gray for subtitles
    marginBottom: '10px',
    fontStyle: 'italic',
  },
  listItem: {
    color: '#4A5568',
    marginBottom: '8px',
    fontSize: '0.95rem',
  },
  plotContainer: {
    marginBottom: '40px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
  },
  slider: {
    color: '#0D47A1',
    width: '80%',
    margin: '0 auto',
    display: 'block',
  },
  dataGrid: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: '#0D47A1',
      color: '#ffffff',
      fontWeight: 600,
      borderBottom: '2px solid #ffffff',
    },
    '& .MuiDataGrid-cell': {
      color: '#2D3748',
    },
    '& .MuiDataGrid-row:hover': {
      backgroundColor: '#E3F2FD', // Light blue hover
    },
  },
  typographyBody2: {
    color: '#4A5568',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginTop: '10px',
  },
});

export default useAnalyzingKmeansStyles;
