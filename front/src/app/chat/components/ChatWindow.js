import styles from "/styles/chatWindowStyle";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"
import SelectML from "./SelectML";
import ChatContent from "./ChatContent";
import { fetchChatRoom, fetchChatList, fetchModel, fetchNewModel, createAnalyze, createConversation, fetchOtherModel } from "@/api";
import Loading from "./Loading";
import FileUploader from "./FileUploader";
import RequirementUploader from "./RequirementUploader";
import NewChat from "./NewChat";
import { convertEucKrToUtf8, convertUtf8ToArrayBuffer } from '../../../lib/encoding';
import Loading2 from "./Loading2";
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
    const [refreshKey, setRefreshKey] = useState(0);
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [otherReply, setOtherReply] = useState('');

    const handleGoBack = () => {
        if (pageHistory.length > 0) {
            const lastPage = pageHistory.pop();
            setPage(lastPage);
            setPageHistory([...pageHistory]);
        }
    };

    const getChatList = async () => {
        try {
            if (!sessionId) return;
            const response = await fetchChatList(sessionId);
            const chats = response.data;

            setChatList(chats);

        } catch (error) {
            handleChangeHome();
        }
    };

    useEffect(() => {
        getChatList();
    }, [sessionId]);

    const handleOtherModels = async (resultFromModel) => {
        try {
            const data = {
                chatRoomId: resultFromModel.chatRoomId,
                requestId: resultFromModel.requestId
            };

            const response = await fetchOtherModel(data, sessionId);
            const result = response.data;

            setModels(result.model_recommendations);
            setPurpose(result.purpose_understanding);
            setOverview(result.data_overview);
            setRequestId(result.requestId);
            handleChangePage('selectML');

        } catch (error) {
            handleChangeHome();
        }
    }

    const handleConversation = async (requirement, chatRoomId, requestId, sessionId) => {
        setPage('loading2');

        try {
            const data = {
                "requestId": requestId,
                "chatRoomId": chatRoomId,
                "text": requirement
            }
            const response = await createConversation(data, sessionId);
            const result = response.data;

            setPage('chatContent');
            setRefreshKey(prevKey => prevKey + 1);
            setScrollToBottom(true);

        } catch (error) {
            handleChangeHome();
        }
    }

    const handleChatRoomId = () => {

        const newChatRoomId = uuidv4();
        setChatRoomId(newChatRoomId);
        setPage('fileUploader');
    }

    const handleMenuItemClick = async (chatRoomId, fileName) => {

        try {
            const response = await fetchChatRoom(chatRoomId, sessionId);
            const result = response.data;
            setChatContent(result);
            setFileName(fileName);
            setChatRoomId(chatRoomId)
            setPage('chatContent');

        } catch (error) {
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
        setFileName(files[0].name);
    }

    const handleSubmit = async () => {

        if (!files && !requirement) {
            return;
        }

        const formData = new FormData();

        formData.append("chatRoomId", chatRoomId);

        for (const file of submittedFile) {
            const arrayBuffer = await file.arrayBuffer();
            const utf8String = convertEucKrToUtf8(arrayBuffer);
            const utf8ArrayBuffer = convertUtf8ToArrayBuffer(utf8String);
            const utf8Blob = new Blob([utf8ArrayBuffer], { type: 'text/csv' });
            const utf8File = new File([utf8Blob], file.name, { type: 'text/csv' });

            formData.append('files', utf8File);
        }
        formData.append("requirement", submittedRequirement);

        setCurrentStep(1);
        setIsLoading(true);
        setPage('loading');

        try {
            const response = await fetchModel(formData, sessionId);
            const result = response.data;

            setModels(result.model_recommendations);
            setPurpose(result.purpose_understanding);
            setOverview(result.data_overview);
            setRequestId(result.requestId);
            handleChangePage('selectML');

            if (response.status != 200) {
                throw new Error("업로드 실패");
            }

        } catch (error) {
            handleChangeHome();

        } finally {
            setIsLoading(false);
        }

    };

    const handleReSubmit = async (requirement, chatRoomId, requestId) => {

        if (!requirement) {
            return;
        }

        setCurrentStep(1);
        setIsLoading(true);
        setPage('loading');

        try {
            const data = {
                "chatRoomId": chatRoomId,
                "requestId": requestId,
                "newRequirement": requirement
            }

            const response = await fetchNewModel(data, sessionId);
            const result = response.data;

            setModels(result.model_recommendations);
            setPurpose(result.purpose_understanding);
            setOverview(result.data_overview);
            setRequestId(result.requestId);
            setOtherReply(result.other_reply);
            handleChangePage('selectML');

            if (response.status != 200) {
                throw new Error("업로드 실패");
            }

        } catch (error) {
            handleChangeHome();

        } finally {
            setIsLoading(false);
        }
    };


    const handleModelSelect = async (chatRoomId, requestId, index) => {

        if (!chatRoomId) {
            return;
        }

        setCurrentStep(3);
        setIsLoading(true);
        setPage('loading');

        try {
            const data = {
                "chatRoomId": chatRoomId,
                "requestId": parseInt(requestId),
                "selectedModel": index
            }

            const response = await createAnalyze(data, sessionId);
            const result = response.data;

            const chatResponse = await fetchChatRoom(chatRoomId, sessionId);
            const chatResult = chatResponse.data;
            setChatContent(chatResult);
            handleChangePage('chatContent')

            setResult(result);

        } catch (error) {
            handleChangeHome();

        } finally {
            setIsLoading('false');
            getChatList();
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
            {page === 'selectML' && <SelectML chatRoomId={chatRoomId} models={models} purpose={purpose} overview={overview} requestId={requestId} onModelSelect={handleModelSelect} onSubmit={handleSubmit} onReSubmit={handleReSubmit} otherReply={otherReply}/>}
            {page === 'chatContent' && <ChatContent fileName={fileName} result={result} sessionId={sessionId} chatContent={chatContent} onModelSelect={handleModelSelect} onSubmit={handleConversation} onOtherModels={handleOtherModels} onChangePage={handleChangePage} refreshKey={refreshKey} onMenuClick={handleMenuItemClick} setScrollToBottom={setScrollToBottom} scrollToBottom={scrollToBottom} />}
            {page === 'loading' && <Loading currentStep={currentStep} />}
            {page === 'fileUploader' && <FileUploader onChangePage={handleChangePage} onSubmitFiles={handleSubmitFiles} />}
            {page === 'requirementUploader' && <RequirementUploader onChangePage={handleChangePage} onSubmitRequirement={handleSubmitRequirement} onSubmit={handleSubmit} />}
            {page === 'loading2' && <Loading2 />}
            {page === 'newChat' && <NewChat />}
        </div>
    );
}