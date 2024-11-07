import { useState } from "react";
import styles from "/styles/chatContentStyle";
import Bar from "./graphs/Bar";
import Line from "./graphs/Line";
import Pie from "./graphs/Pie";
import Scatter from "./graphs/Scatter";
import Table from "./graphs/Table";

export default function ChatContent({ file, message, result }) {
    const [showResult, setShowResult] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    // const [graph, setGraph] = useState([]);

    // setGraph(result.graphs);

    // 테스트
    const graph = {
            "graph_type": "bar",
            "feature_importances": [
                0.03775190254363688,
                0.08938810305355624,
                0.006150771029092867,
                0.06639873937575208,
                0.5680831739370535,
                0.09032305358188948,
                0.03035999215656699,
                0.052768040517456406,
                0.0,
                0.0012956350905723405,
                0.005189321340714461,
                0.0022890055983500004,
                0.0006801452584825661,
                0.0,
                0.013905893968981165,
                0.0,
                9.247261710556976e-05,
                0.005658250216167483,
                0.0026772227204338336,
                0.0,
                0.0,
                0.0,
                0.0,
                9.880970167837081e-05,
                0.0,
                0.0,
                0.0,
                0.0,
                0.007553896344754013,
                0.0017296729980318475,
                0.0,
                8.865248226950267e-05,
                0.0,
                0.005046641912088252,
                0.005075245881269651,
                0.005719438292925068,
                0.0,
                0.0,
                0.0,
                0.0014083964774828303,
                0.0,
                0.0,
                0.00026752290368843926,
                0.0
            ],
            "feature_names": [
                "EmpSatisfaction",
                "EngagementSurvey",
                "SpecialProjectsCount",
                "Absences",
                "DaysLateLast30",
                "Salary",
                "TenureDays",
                "ManagerID",
                "Department_Executive Office",
                "Department_IT/IS",
                "Department_Production       ",
                "Department_Sales",
                "Department_Software Engineering",
                "Position_Administrative Assistant",
                "Position_Area Sales Manager",
                "Position_BI Developer",
                "Position_BI Director",
                "Position_CIO",
                "Position_Data Analyst",
                "Position_Data Analyst ",
                "Position_Data Architect",
                "Position_Database Administrator",
                "Position_Director of Operations",
                "Position_Director of Sales",
                "Position_Enterprise Architect",
                "Position_IT Director",
                "Position_IT Manager - DB",
                "Position_IT Manager - Infra",
                "Position_IT Manager - Support",
                "Position_IT Support",
                "Position_Network Engineer",
                "Position_President & CEO",
                "Position_Principal Data Architect",
                "Position_Production Manager",
                "Position_Production Technician I",
                "Position_Production Technician II",
                "Position_Sales Manager",
                "Position_Senior BI Developer",
                "Position_Shared Services Manager",
                "Position_Software Engineer",
                "Position_Software Engineering Manager",
                "Position_Sr. Accountant",
                "Position_Sr. DBA",
                "Position_Sr. Network Engineer"
            ]
        }

    const handleDownload = () => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;  
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 
    };

    const handleResultClick = () => {
        setShowResult(true); 
    };

    const handleCloseDashBoard = () => {
        setShowResult(false); 
        setIsExpanded(false); 
    };

    return (
        <div style={styles.chatContainer}>
            {/* 왼쪽 채팅창 */}
            <div style={showResult ? styles.leftSection : styles.fullScreenChat}>
                <div style={styles.chatWindow}>
                    <div style={styles.file}>
                        <img src="/img/csv.png" style={styles.img}/>
                        <span onClick={handleDownload}>{file.name}</span>
                    </div>
                    <div style={styles.user}>
                        <span>{message}</span>
                    </div>
                    <div style={styles.serverContainer}>
                        <img src="/img/icon.png" alt="logo" style={styles.icon}/>
                        <span onClick={handleResultClick} style={styles.server}>
                            분석 결과를 보려면 여기를 클릭하세요.
                        </span>  
                    </div>
                </div>
            </div>

            {/* 오른쪽 분석 결과 창 */}
            {showResult && (
                <div style={styles.rightSection}>
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div style={styles.resultContent}>
                        {/* 그래프 타입에 따른 컴포넌트 */}
                        <Scatter/>
                        <Bar/>
                        <Table/>
                        {/* {graph.graph_type === 'bar' && <Bar graph={graph}/>}
                        {graph.graph_type === 'line' && <Line graph={graph}/>}
                        {graph.graph_type === 'pie' && <Pie graph={graph}/>}
                        {graph.graph_type === 'scatter' && <Scatter graph={graph}/>} */}
                    </div>
                </div>
            )}
        </div>
    );
}
