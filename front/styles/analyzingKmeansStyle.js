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
    display: "flex", // Flexbox 사용
    flexDirection: "column", // 수직 정렬
    justifyContent: "center", // 가로 중앙 정렬
    alignItems: "center", // 세로 중앙 정렬
    padding: "20px", // 그래프와 컨테이너 간의 여백 추가
  },
  axisDescriptions: {
    marginTop: "10px",
    textAlign: "center",
    maxWidth: "600px", // 설명 텍스트의 최대 너비 설정
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
    // 열 헤더 스타일
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: "#1a202c", // 어두운 회색 또는 다른 대비 색상
      color: "black", // 흰색 텍스트
      fontWeight: 700,
      borderBottom: "2px solid #4a5568",
      fontSize: "1rem",
    },
    // 셀 텍스트 스타일
    "& .MuiDataGrid-cell": {
      color: "#2D3748", // 다크 그레이 텍스트
      fontSize: "0.9rem",
    },
    // 행 호버 스타일
    "& .MuiDataGrid-row:hover": {
      backgroundColor: "#f0f4f8", // 밝은 회색 호버
    },
    // 푸터 스타일
    "& .MuiDataGrid-footerContainer": {
      backgroundColor: "#ffffff",
      borderTop: "2px solid #e2e8f0",
    },
    // 선택된 행 스타일
    "& .MuiDataGrid-row.Mui-selected": {
      backgroundColor: "#bee3f8", // 선택된 행의 배경색
      color: "#2D3748",
      "&:hover": {
        backgroundColor: "#90cdf4",
      },
    },
    // 체크박스 스타일
    "& .MuiCheckbox-root": {
      color: "#0D47A1",
    },
    // 페이지 네비게이션 버튼 스타일
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
    // color will be set dynamically
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
