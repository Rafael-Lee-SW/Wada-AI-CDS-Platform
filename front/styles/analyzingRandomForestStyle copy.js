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
    display: "flex", // Flexbox 사용
    flexDirection: "column", // 수직 정렬
    justifyContent: "center", // 가로 중앙 정렬
    alignItems: "center", // 세로 중앙 정렬
    padding: "20px", // 그래프와 컨테이너 간의 여백 추가
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
