import styles from "/styles/chatWindowStyle";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"
import SelectML from "./SelectML";
import ChatContent from "./ChatContent";
import { fetchChatRoom, fetchChatList, fetchModel, fetchNewModel, createAnalyze, createConversation } from "@/api";
import Loading from "./Loading";
import FileUploader from "./FileUploader";
import RequirementUploader from "./RequirementUploader";
import NewChat from "./NewChat";
import { convertEucKrToUtf8, convertUtf8ToArrayBuffer } from '../../../lib/encoding'; // Adjust the path as needed
import { restyle } from "plotly.js";

export default function Home({ sessionId }) {
    const [pageHistory, setPageHistory] = useState([]);
    const [submittedFile, setSubmittedFile] = useState([]);
    const [submittedRequirement, setSubmittedRequirement] = useState('');
    const [requirement, setRequirement] = useState('');
    const [page, setPage] = useState('newChat');
    const [models, setModels] = useState([]);
    const [purpose, setPurpose] = useState();
    const [overview, setOverview] = useState();
    const [result, setResult] = useState(null);
    const [requestId, setRequestId] = useState(null);
    const [chatRoomId, setChatRoomId] = useState('');
    const [chatList, setChatList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [chatContent, setChatContent] = useState(null);
    const [fileName, setFileName] = useState('');

    const handleGoBack = () => {
        if (pageHistory.length > 0) {
            const lastPage = pageHistory.pop();
            setPage(lastPage);
            setPageHistory([...pageHistory]);
        }
    };

    useEffect(() => {
        const getChatList = async () => {
            try {
                if (!sessionId) return;

                console.log("대화기록불러오기에 사용되는 sessionId: ", sessionId);
                const response = await fetchChatList(sessionId);
                const chats = response.data;
                console.log("불러온 채팅: ", chats);

                setChatList(chats);

            } catch (error) {
                console.error("대화 기록 불러오기 실패:", error);
            }
        };

        getChatList();
    }, [sessionId]);

    const handleConversation = async (requirement, chatRoomId, requestId, sessionId) => {
        try {
            const data = {
                "requestId": requestId,
                "chatRoomId": chatRoomId,
                "text": requirement
            }
            console.log("보고서 기반 데이터: ", data);
            const response = await createConversation(data, sessionId);
            const result = response.data;

            console.log("추가 대화 답변: ", result.answer);
        } catch (error) {
            console.log("보고서 기반 대화 에러: ", error);
        }
    }

    const handleChatRoomId = () => {

        const newChatRoomId = uuidv4();
        setChatRoomId(newChatRoomId);
        setPage('fileUploader');
    }

    const handleMenuItemClick = async (chatRoomId, fileName) => {

        setIsLoading(true);
        setPage('loading2');

        try {
            const response = await fetchChatRoom(chatRoomId, sessionId);
            const result = response.data;
            setChatContent(result);
            setFileName(fileName);
            setPage('chatContent');

        } catch (error) {
            console.error("대화 내용 불러오기 실패:", error);
            setIsLoading(false);
            setPage('newChat');
        }
    };

    const handleChangePage = (newPage) => {
        setPageHistory((prevHistory) => [...prevHistory, page]);
        setPage(newPage);
    };


    const handleChangeHome = (event) => {
        event.preventDefault();
        setPage('newChat');
    }

    const handleSubmitFiles = (files) => {
        setFiles(files);
        setSubmittedFile(files);
    }

    const handleSubmitRequirement = async (requirement) => {
        setRequirement(requirement);
        setSubmittedRequirement(requirement);
    }

    const handleSubmit = async () => {

        if (!files && !requirement) {
            return;
        }

        console.log("파일, 요청사항 업로드 확인");
        console.log("chatRoomId: ", chatRoomId);
        console.log("files: ", files);
        console.log("requirement: ", requirement);

        const formData = new FormData();

        formData.append("chatRoomId", chatRoomId);

        // Process each file: Convert EUC-KR to UTF-8
        for (const file of submittedFile) {
            const arrayBuffer = await file.arrayBuffer();
            const utf8String = convertEucKrToUtf8(arrayBuffer);
            const utf8ArrayBuffer = convertUtf8ToArrayBuffer(utf8String);
            const utf8Blob = new Blob([utf8ArrayBuffer], { type: 'text/csv' });
            const utf8File = new File([utf8Blob], file.name, { type: 'text/csv' });

            formData.append('files', utf8File);
        }
        formData.append("requirement", submittedRequirement);



        console.log("FormData 내용:");
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        setCurrentStep(1);
        setIsLoading(true);
        setPage('loading');

        try {
            const response = await fetchModel(formData, sessionId);
            const result = response.data;

            console.log("최초 모델 추천 결과: ", result);
            console.log("최초 모델 추천 requestId: ", result.requestId);

            // 추천 모델들, 목적, 요약 저장
            setModels(result.model_recommendations);
            setPurpose(result.purpose_understanding);
            setOverview(result.data_overview);
            setRequestId(result.requestId);
            handleChangePage('selectML');

            if (response.status != 200) {
                throw new Error("업로드 실패");
            }

        } catch (error) {
            console.error("에러 발생:", error);

        } finally {
            setIsLoading(false);
        }

    };

    const handleReSubmit = async (requirement, chatRoomId, requestId) => {

        if (!requirement) {
            return;
        }

        console.log("추가요청사항: ", requirement);
        setCurrentStep(1);
        setIsLoading(true);
        setPage('loading');

        try {
            const data = {
                "chatRoomId": chatRoomId,
                "requestId": requestId,
                "newRequirement": requirement
            }
            console.log("추가요청사항으로 보내는 데이터: ", data);

            const response = await fetchNewModel(data, sessionId);
            const result = response.data;
            console.log("추가요청 결과: ", result);
            console.log("추가요청 requestId: ", result.requestId);

            setModels(result.model_recommendations);
            setPurpose(result.purpose_understanding);
            setOverview(result.data_overview);
            setRequestId(result.requestId);
            handleChangePage('selectML');

            if (response.status != 200) {
                throw new Error("업로드 실패");
            }

        } catch (error) {
            console.error("에러 발생:", error);

        } finally {
            setIsLoading(false);
        }
    };


    const handleModelSelect = async (chatRoomId, requestId, index) => {

        console.log("모델 선택 후 보내는 데이터")
        console.log("chatRoomId: ", chatRoomId);
        console.log("requestId: ", requestId, "requestId Type: ", typeof requestId);
        console.log("index: ", index, "index Type: ", typeof index);

        setCurrentStep(3);
        setIsLoading(true);
        setPage('loading');

        try {
            const data = {
                "chatRoomId": chatRoomId,
                "requestId": parseInt(requestId),
                "selectedModel": index
            }

            console.log("data 전체: ", data);
            const response = await createAnalyze(data, sessionId);
            const result = response.data;

            const chatResponse = await fetchChatRoom(chatRoomId, sessionId);
            const chatResult = chatResponse.data;
            setChatContent(chatResult);
            handleChangePage('chatContent')

            setResult(result);
            console.log("최종 데이터: ", result);

        } catch (error) {
            // 테스트용 
            setPage('chatContent');
            console.error("모델 선택 중 에러 발생:", error);

        } finally {
            setIsLoading('false');
        }
    };

    return (
        <div style={styles.mainContainer}>
            <div style={styles.sidebar}>
                <div style={styles.info}>
                    <img src="/img/icon.png" style={styles.icon} />
                    <span style={styles.headerMessage} onClick={handleChangeHome}>원하는Da로</span>
                </div>
                <div style={styles.menu}>
                    <div style={styles.menuItemTitle}>
                        <p>분석 기록</p>
                    </div>
                    <div style={styles.newButtonContainer}>
                        <button style={styles.newButton} onClick={handleChatRoomId}>+ 새 채팅</button>
                    </div>
                    <div style={styles.chatListContainer}>
                        {chatList.length > 0 ? (
                            chatList.map((chat, index) => (
                                <div key={index} style={styles.menuItem} onClick={() => handleMenuItemClick(chat.chatRoomId, chat.fileName)}>
                                    <img style={styles.arrow} src="/img/arrow.png" alt="arrow" />
                                    <p style={styles.chatList}>{chat.fileName}</p>
                                </div>
                            ))
                        ) : null}
                    </div>
                </div>
            </div>
            <img
                src="/img/goBack.png"
                onClick={handleGoBack}
                style={{
                    width: '20px',
                    position: 'absolute',
                    op: 20,
                    left: 20,
                    zIndex: 9999,
                    position: 'fixed',
                    left: '200px',
                    top: '18px',
                    display: (page === 'fileUploader' || page === 'newChat') ? 'none' : 'block'
                }} />
            {page === 'selectML' && <SelectML chatRoomId={chatRoomId} models={models} purpose={purpose} overview={overview} requestId={requestId} onModelSelect={handleModelSelect} onSubmit={handleSubmit} onReSubmit={handleReSubmit} />}
            {page === 'chatContent' && <ChatContent fileName={fileName} result={result} sessionId={sessionId} chatContent={chatContent} onModelSelect={handleModelSelect} onSubmit={handleConversation} />}
            {page === 'loading' && <Loading currentStep={currentStep} />}
            {page === 'fileUploader' && <FileUploader onChangePage={handleChangePage} onSubmitFiles={handleSubmitFiles} />}
            {page === 'requirementUploader' && <RequirementUploader onChangePage={handleChangePage} onSubmitRequirement={handleSubmitRequirement} onSubmit={handleSubmit} />}
            {page === 'loading2' && <Loading />}
            {page === 'newChat' && <NewChat />}
        </div>
    );
}