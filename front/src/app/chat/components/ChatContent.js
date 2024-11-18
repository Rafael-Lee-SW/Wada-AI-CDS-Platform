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
    }

    const handleResultClick = async (result) => {
        setResultFromModel(result);
        setShowResult(true);
        console.log("분석결과보기로 넘겨받은 데이터: ", result);
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
                                        {requirement.resultFromModel.model} 모델로 분석한 결과입니다.
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
                                    <div style={styles.serverContainer} ref={bottomRef}>
                                        <img src="/img/icon.png" alt="logo" style={styles.icon} />
                                        <span style={styles.conversation}>
                                            {(() => {
                                                // 'record.answer'가 존재하는 경우에만 처리
                                                if (record.answer) {
                                                    // 마침표, 물음표, 느낌표를 기준으로 문장을 나누고, 그 사이에 줄바꿈을 추가
                                                    let formattedText = record.answer.replace(/([.!?])\s*(?=[A-Za-z가-힣])/g, '$1\n');
                                                    return formattedText;
                                                } else {
                                                    return '답변을 불러올 수 없습니다.';
                                                }
                                            })()}
                                        </span>
                                    </div>
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
                    <button onClick={handleCloseDashBoard} style={styles.closeButton}>X</button>
                    <div style={styles.resultContent}>
                        <Report result={resultFromModel} />
                    </div>
                </div>
            )}
        </div>
    );
}
