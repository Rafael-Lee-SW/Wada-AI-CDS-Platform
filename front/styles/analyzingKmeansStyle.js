// src/styles/analyzingKmeansStyle.js

import { makeStyles } from "@mui/styles";

const useAnalyzingKmeansStyles = makeStyles({
  container: {
    padding: "30px",
    background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)",
    minHeight: "100vh",
  },
  reportTitle: {
    fontWeight: 700,
    color: "#2D3748",
    marginBottom: "40px",
    textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
  },
  subTitle: {
    fontSize: '30px'
  },
  sectionTitle: {
    fontWeight: 600,
    color: "#2D3748",
    marginBottom: "20px",
    borderBottom: "3px solid #0D47A1",
    display: "inline-block",
    paddingBottom: "5px",
  },
  bodyText: {
    color: "#4A5568",
    marginBottom: "20px",
    lineHeight: 1.8,
    fontSize: "1rem",
  },
  card: {
    marginBottom: "20px",
    borderRadius: "16px",
    background: "linear-gradient(145deg, #ffffff, #e6e6e6)",
    boxShadow: "8px 8px 16px #c5c5c5, -8px -8px 16px #ffffff",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "12px 12px 24px #c5c5c5, -12px -12px 24px #ffffff",
    },
  },
  cardContent: {
    padding: "20px",
  },
  cardTitle: {
    fontWeight: 600,
    color: "#0D47A1",
    marginBottom: "10px",
  },
  cardSubtitle: {
    color: "#718096",
    marginBottom: "10px",
    fontStyle: "italic",
  },
  listItem: {
    color: "#4A5568",
    marginBottom: "8px",
    fontSize: "0.95rem",
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
  axisDescriptions: {
    marginTop: "10px",
    textAlign: "center",
    maxWidth: "600px", 
  },
  axisDescription: {
    color: "#4A5568",
    fontSize: "0.875rem",
    marginTop: "5px",
  },
  slider: {
    color: "#0D47A1",
    width: "80%",
    margin: "0 auto",
    display: "block",
  },
  dataGrid: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: "#1a202c", 
      color: "black", 
      fontWeight: 700,
      borderBottom: "2px solid #4a5568",
      fontSize: "1rem",
    },
    "& .MuiDataGrid-cell": {
      color: "#2D3748", 
      fontSize: "0.9rem",
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: "#f0f4f8", 
    },
    "& .MuiDataGrid-footerContainer": {
      backgroundColor: "#ffffff",
      borderTop: "2px solid #e2e8f0",
    },
    "& .MuiDataGrid-row.Mui-selected": {
      backgroundColor: "#bee3f8", 
      color: "#2D3748",
      "&:hover": {
        backgroundColor: "#90cdf4",
      },
    },
    "& .MuiCheckbox-root": {
      color: "#0D47A1",
    },
    "& .MuiPaginationItem-root": {
      color: "#0D47A1",
    },
  },
  clusterInfoCard: {
    marginTop: "40px",
    borderRadius: "16px",
    background: "white",
    boxShadow: "8px 8px 16px #c5c5c5, -8px -8px 16px #ffffff",
    padding: "20px",
  },
  clusterInfo: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "#ebe7f1",
  },
  clusterTitle: {
    fontWeight: 600,
  },
  clusterDescription: {
    color: "#4A5568",
    fontSize: "0.875rem",
    marginLeft: "10px",
  },
  typographyBody2: {
    color: "#4A5568",
    fontSize: "0.875rem",
    textAlign: "center",
    marginTop: "10px",
  },
});

export default useAnalyzingKmeansStyles;
