// src/styles/analyzingRandomForestStyle.js

import { makeStyles } from "@mui/styles";

const useVisualizationStyles = makeStyles({
  container: {
    padding: "20px",
  },
  sectionTitle: {
    marginTop: "20px",
    marginBottom: "10px",
    fontWeight: "bold",
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
  card: {
    marginBottom: "10px",
  },
  cardTitle: {
    fontWeight: "bold",
    color: "#3f51b5",
  },
  bodyText: {
    fontSize: "14px",
  },
  dataGrid: {
    backgroundColor: "#f5f5f5",
  },
});

export default useVisualizationStyles;
