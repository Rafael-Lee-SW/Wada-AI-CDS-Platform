import { useEffect, useState, useRef } from "react";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from "/styles/chatContentStyle";
import Report from "@/app/report/page";
import { fetchOtherModel } from "@/api";

export default function ChatContent({ file, message, result, sessionId, chatContent }) {
    const printRef = useRef();
    const [showResult, setShowResult] = useState(false);
    const [resultFromModel, setResultFromModel] = useState(null);
    const [otherModels, setOtherModels] = useState(false);
    const [models, setModels] = useState(null);
    const [inputValue, setInputValue] = useState("");

    const currentFile = chatContent[0].fileUrl

    console.log(chatContent);

    const handleDownloadPDF = async () => {
        const element = printRef.current;        
        // html2canvas 옵션 설정
        const canvas = await html2canvas(element, {
            scale: 2, // 해상도를 높이기 위해 배율 설정
            useCORS: true, // 크로스 도메인 이미지 사용 허용
            windowWidth: document.documentElement.scrollWidth, // 전체 너비 캡처
            windowHeight: document.documentElement.scrollHeight // 전체 높이 캡처
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // 전체 캔버스를 페이지로 분할
        let imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let position = 0;
        
        while (position < imgHeight) {
            pdf.addImage(imgData, 'PNG', 0, position ? 0 : 0, pdfWidth, pdfHeight);
            position += pdfHeight;
            if (position < imgHeight) pdf.addPage(); // 다음 페이지 추가
        }

        pdf.save('dashboard.pdf');
    };

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

    const handleResultClick = async (result) => {
        setResultFromModel(result);
        
        try {
            const data = {
                "chatRoomId": result.chatRoomId,
                "requestId": result.requestId
            }

            console.log("다른 모델 받아오기: ", data);

            const response = await fetchOtherModel(data, sessionId);
            const models = response.data.model_recommendations;
            console.log("받아온 다른 모델: ", models);
            setModels(models);

        } catch (error) {
            console.log("다른 모델 받아오기 에러: ", error);
        }

        setShowResult(true); 
        setOtherModels(true);
    };

    const handleCloseDashBoard = () => {
        setShowResult(false); 
        setOtherModels(false);
    };

    return (
        <div style={styles.chatContainer}>
            {!showResult && (
                <div style={styles.inputContainer}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="보고서에 대해 질문해주세요."
                        style={styles.input}
                    />
                    <img src="/img/inputButton.png" style={styles.inputImg}/>
                </div>
            )}
            <div style={showResult ? styles.leftSection : styles.fullScreenChat}>
                {showResult && (
                    <div style={styles.inputContainerLeft}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="보고서에 대해 질문해주세요."
                            style={styles.input}
                        />
                        <img src="/img/inputButton.png" style={styles.inputImg}/>
                    </div>
                )}
                <div style={styles.chatWindow}>
                    <div style={styles.file}>
                        <img src="/img/csv.png" style={styles.img} alt="file icon" />
                        <span onClick={() => handleDownload(fileItem)}>{currentFile}</span>
                    </div>
                    {/* chatContent 배열을 돌며 조건에 맞는 요소 렌더링 */}
                    {chatContent.map((requirement, index) => (
                        <div key={index}>
                            {/* requirement.requirement 출력 */}
                            <div style={styles.user}>
                                <span>{requirement.requirement}</span>
                            </div>

                            {/* resultFromModel이 null이 아니면 추가 렌더링 */}
                            {requirement.resultFromModel !== null && (
                                <div style={styles.serverContainer}>
                                    <img src="/img/icon.png" alt="logo" style={styles.icon} />
                                    <span
                                        onClick={() => handleResultClick(requirement)} // 클릭 시 resultFromModel을 Report 컴포넌트로 전달
                                        style={styles.server}
                                    >
                                        분석 결과를 보려면 여기를 클릭하세요.
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                    {otherModels && models !== null && (
                        <div>
                            <p>다른 모델로 분석하기</p>
                            <div style={styles.otherModelContainer}>
                                {models && models.map ((model, index) => (
                                    <div key={index} style={styles.modelCard}>
                                        <p>{model.implementation_request.model_choice}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showResult && (
                <div style={styles.rightSection}>
                    <img src="/img/pdf.png" alt="pdf" style={styles.pdfImg} onClick={handleDownloadPDF}/>
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div ref={printRef} style={styles.resultContent}>
                        <Report result={resultFromModel}/>
                    </div>
                </div>
            )}
        </div>
    );
}
