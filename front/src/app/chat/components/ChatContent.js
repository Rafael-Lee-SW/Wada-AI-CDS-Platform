import { useEffect, useState, useRef } from "react";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from "/styles/chatContentStyle";
import Report from "@/app/report/page";
import { fetchOtherModel } from "@/api";

export default function ChatContent({ fileName, sessionId, chatContent, onModelSelect, onSubmit}) {
    const printRef = useRef();
    const [showResult, setShowResult] = useState(false);
    const [resultFromModel, setResultFromModel] = useState(null);
    const [otherModels, setOtherModels] = useState(false);
    const [models, setModels] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [hoveredCard, setHoveredCard] = useState(false);
    const [lastRequestId, setLastRequestId] = useState(0);
    const [chatRoomId, setChatRoomId] = useState();

    const currentFile = chatContent[0].fileUrl

    useEffect(() => {
    if (chatContent && chatContent.length > 0) {
        const lastElement = chatContent[chatContent.length - 1];
        console.log("마지막 requestId: ", lastElement.requestId);
        setLastRequestId(lastElement.requestId);

        // chatRoomId도 설정
        if (chatContent[0].chatRoomId) {
            setChatRoomId(chatContent[0].chatRoomId);
        }
        }
    }, [chatContent]);

    console.log(chatContent);

    const handleSendClick = () => {

        if (!inputValue || !chatRoomId || !lastRequestId || !sessionId) {
            console.log("값이 누락되었습니다: ", { inputValue, chatRoomId, lastRequestId, sessionId });
            return;
        }

        onSubmit(inputValue, chatRoomId, lastRequestId, sessionId);
        console.log("보고서 기반 대화 함수 호출: ", inputValue, chatRoomId, lastRequestId, sessionId);
        setInputValue(''); 
    };

    const handleModelClick = (chatRoomId, requestId, index) => {
        onModelSelect(chatRoomId, requestId, index);
    };

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

    const handleDownload = async () => {
        try {
            // S3에서 파일을 가져오기 위해 currentFile을 사용
            const response = await fetch(currentFile);

            // 응답이 성공적이지 않으면 에러 처리
            if (!response.ok) {
                throw new Error("파일을 찾을 수 없습니다.");
            }

            // 파일을 blob 형태로 변환
            const blob = await response.blob();

            // 다운로드를 위한 링크 생성
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            
            // 링크의 다운로드 속성에 파일명을 설정 (URL에서 파일명 추출)
            link.href = url;
            link.download = currentFile.split("/").pop();  // 파일 이름을 URL에서 추출하여 사용
            document.body.appendChild(link);
            link.click();  // 링크 클릭을 통해 다운로드 트리거
            
            // 다운로드 후 URL 해제
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.log("파일 다운로드 중 에러가 발생했습니다: ", error);
        }
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
                    <img src="/img/inputButton.png" style={styles.inputImg} onClick={handleSendClick}/>
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
                        <img src="/img/inputButton.png" style={styles.inputImg} onClick={handleSendClick}/>
                    </div>
                )}
                <div style={styles.chatWindow}>
                    <div style={styles.file}>
                        <img src="/img/csv.png" style={styles.img} alt="file icon" />
                        <span onClick={() => handleDownload()}>{fileName}</span>
                    </div>
                    {/* chatContent 배열을 돌며 조건에 맞는 요소 렌더링 */}
                    {chatContent.map((requirement, index) => (
                    <div key={index}>
                        {/* 1. requirement.requirement 출력 */}
                        {requirement.requirement && (
                            <div style={styles.user}>
                                <span>{requirement.requirement}</span>
                            </div>
                        )}
                        
                        {/* 2. 분석 결과를 보려면 여기를 클릭하세요 */}
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
                        
                        {/* 3. conversationRecord가 존재할 경우 */}
                        {requirement.conversationRecord && requirement.conversationRecord.map((record, recordIndex) => (
                            <div key={recordIndex}>
                                {/* question 출력 */}
                                {record.question && (
                                    <div style={styles.user}>
                                        <span>{record.question}</span>
                                    </div>
                                )}
                                
                                {/* answer 출력: JSON 파싱 후 answer.choices[0].message.content 렌더링 */}
                                {record.answer && (
                                    <div style={styles.serverContainer}>
                                        <img src="/img/icon.png" alt="logo" style={styles.icon} />
                                        <span style={styles.conversation}>
                                            {(() => {
                                                try {
                                                    const parsedAnswer = JSON.parse(record.answer);
                                                    const nestedContent = JSON.parse(parsedAnswer.choices[0].message.content);
                                                    return nestedContent.answer;
                                                } catch (error) {
                                                    console.error("JSON 파싱 에러: ", error);
                                                    return "답변을 불러올 수 없습니다.";
                                                }
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

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
