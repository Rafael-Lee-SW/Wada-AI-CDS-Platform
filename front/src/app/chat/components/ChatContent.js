import { useEffect, useState, useRef } from "react";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from "/styles/chatContentStyle";
import Report from "@/app/report/page";
import { fetchOtherModel } from "@/api";

export default function ChatContent({ fileName, sessionId, chatContent, onModelSelect, onSubmit, onOtherModels, onChangePage, refreshKey, onMenuClick, scrollToBottom, setScrollToBottom }) {
    const printRef = useRef();
    const [showResult, setShowResult] = useState(false);
    const [resultFromModel, setResultFromModel] = useState(null);
    const [otherModels, setOtherModels] = useState(false);
    const [models, setModels] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [lastRequestId, setLastRequestId] = useState(0);
    const [chatRoomId, setChatRoomId] = useState();
    const [isHovered, setIsHovered] = useState(false);
    const bottomRef = useRef(null);

    const currentFile = chatContent[0]?.fileUrl;

    // chatContent 배열을 상태로 관리하여 새로운 채팅 메시지가 있을 때 자동으로 렌더링
    const [updatedChatContent, setUpdatedChatContent] = useState(chatContent);

    console.log(updatedChatContent);

    useEffect(() => {
        onMenuClick(chatContent[0].chatRoomId, fileName);
    }, [refreshKey]);


    useEffect(() => {
        // chatContent가 변경되면 업데이트된 내용을 상태에 반영
        setUpdatedChatContent(chatContent);

        if (chatContent.length > 0) {
            const lastElement = chatContent[chatContent.length - 1];
            setLastRequestId(lastElement.requestId);

            if (chatContent[0].chatRoomId) {
                setChatRoomId(chatContent[0].chatRoomId);
            }
        }
    }, [chatContent]); // chatContent 배열이 변경될 때마다 이 useEffect 실행

    useEffect(() => {
        if (scrollToBottom && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
            setScrollToBottom(false);
        }
    }, [scrollToBottom]);

    const handleOtherModels = async () => {
        onOtherModels(resultFromModel);
    }

    const handleSendClick = () => {
        if (!inputValue || !chatRoomId || !lastRequestId || !sessionId) {
            console.log("값이 누락되었습니다: ", { inputValue, chatRoomId, lastRequestId, sessionId });
            return;
        }
        onSubmit(inputValue, chatRoomId, lastRequestId, sessionId);
        setInputValue(''); // 메시지 입력란 비우기
    };

    const handleDownloadPDF = async () => {
        const element = printRef.current;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = element.scrollWidth;
        const canvasHeight = element.scrollHeight;

        let position = 0;
        let pageCount = 0;
        const scale = 2;  // 이미지의 해상도를 높이기 위한 스케일

        try {
            // 캡처할 영역을 전체적으로 한 번에 처리
            const canvas = await html2canvas(element, {
                scale: scale,
                useCORS: true,
                scrollX: 0,
                scrollY: 0,
                width: canvasWidth,
                height: canvasHeight,
                windowWidth: canvasWidth,
                windowHeight: canvasHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const totalPages = Math.ceil(canvasHeight / (pdfHeight * scale)); // 전체 페이지 수 계산

            // 첫 번째 페이지 추가
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight * (canvas.height / canvas.width));

            // 추가 페이지가 있을 경우
            for (let i = 1; i < totalPages; i++) {
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, -(i * pdfHeight * scale), pdfWidth, pdfHeight * (canvas.height / canvas.width));
            }

            // PDF 파일로 저장
            pdf.save('report_full.pdf');
        } catch (error) {
            console.error('PDF 생성 중 오류 발생:', error);
        }
    };




    // const handleDownload = async () => {
    //     try {
    //         if (!currentFile) {
    //             console.error("파일 URL이 없습니다.");
    //             return;
    //         }

    //         const response = await fetch(currentFile);

    //         if (!response.ok) {
    //             throw new Error("파일을 찾을 수 없습니다.");
    //         }

    //         const blob = await response.blob();
    //         const link = document.createElement('a');
    //         const url = window.URL.createObjectURL(blob);

    //         link.href = url;
    //         link.download = currentFile.split("/").pop(); // 파일 이름 추출
    //         document.body.appendChild(link);
    //         link.click();

    //         document.body.removeChild(link);
    //         window.URL.revokeObjectURL(url);

    //     } catch (error) {
    //         console.error("파일 다운로드 중 에러가 발생했습니다: ", error);
    //     }
    // };

    const handleResultClick = async (result) => {
        setResultFromModel(result);
        setShowResult(true);
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
                    <img src="/img/inputButton.png" style={styles.inputImg} onClick={handleSendClick} />
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
                        <img src="/img/inputButton.png" style={styles.inputImg} onClick={handleSendClick} />
                    </div>
                )}
                <div style={styles.chatWindow}>
                    <div style={styles.file}>
                        <img src="/img/csv.png" style={styles.img} alt="file icon" />
                        {/* Use an <a> tag for direct download */}
                        <a href={currentFile} download={fileName} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {fileName}
                        </a>
                    </div>

                    {/* updatedChatContent를 사용하여 자동 업데이트 */}
                    {updatedChatContent.map((requirement, index) => (
                        <div key={index}>
                            {requirement.requirement && (
                                <div style={styles.user}>
                                    <span>{requirement.requirement}</span>
                                </div>
                            )}

                            {requirement.resultFromModel !== null && (
                                <div style={styles.serverContainer}>
                                    <img src="/img/icon.png" alt="logo" style={styles.icon} />
                                    <span onClick={() => handleResultClick(requirement)} style={styles.server}>
                                        분석 결과를 보려면 여기를 클릭하세요.
                                    </span>
                                </div>
                            )}

                            {requirement.conversationRecord && requirement.conversationRecord.map((record, recordIndex) => (
                                <div key={recordIndex}>
                                    {record.question && (
                                        <div style={styles.user}>
                                            <span>{record.question}</span>
                                        </div>
                                    )}

                                    {record.answer && (
                                        <div style={styles.serverContainer} ref={bottomRef}>
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

                    {showResult && (
                        <div style={styles.otherModelTitleContainer}>
                            <div
                                style={{
                                    ...styles.imgContainer,
                                    ...(isHovered && styles.imgContainerHover),
                                }}
                                onClick={handleOtherModels}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <img src="/img/change.gif" style={styles.img} />
                                <p style={styles.text}>다른 모델로 분석하기</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showResult && (
                <div style={styles.rightSection}>
                    <img src="/img/pdf.png" alt="pdf" style={styles.pdfImg} onClick={handleDownloadPDF} />
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div ref={printRef} style={styles.resultContent}>
                        <Report result={resultFromModel} />
                    </div>
                </div>
            )}
        </div>
    );
}
