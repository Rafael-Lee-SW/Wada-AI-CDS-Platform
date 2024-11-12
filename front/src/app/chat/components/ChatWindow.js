import styles from "/styles/chatWindowStyle"; 
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"
import SelectML from "./SelectML";
import ChatContent from "./ChatContent";
import { fetchChatRoom, fetchChatList, fetchModel, createAnalyze } from "@/api";
import Loading from "./Loading";
import FileUploader from "./FileUploader";
import RequirementUploader from "./RequirementUploader";
import NewChat from "./NewChat";

export default function Home({ sessionId }) {

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
    const [graphs, setGraphs] = useState([]);

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

    const handleChatRoomId = () => {

        const newChatRoomId = uuidv4();
        setChatRoomId(newChatRoomId);
        setPage('fileUploader');
    }

    const handleMenuItemClick = async (chatRoomId) => {
        
        setIsLoading(true); 
        setPage('loading2');  

        try {
            const response = await fetchChatRoom(chatRoomId, sessionId);

            const fileUrl = response.data.fileUrl;
            console.log("특정채팅방 내용: ", response.data);
            // const modelResult = response.data.resultFromModel.result;

            setSubmittedFile([fileUrl]);  
            // setResult(modelResult);

            setPage('chatContent');
        } catch (error) {
            console.error("대화 내용 불러오기 실패:", error);
            setIsLoading(false);  
            setPage('fileUploader');  
        }
    };

    const handleChangePage = (pageName) => {
        setPage(pageName);
    }

    const handleChangeHome = (event) => {
        event.preventDefault();
        setPage('fileUploader');
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

        if (Array.isArray(submittedFile)) {
            submittedFile.forEach((file) => {
                formData.append('files', file);  
            });
        } else {
            formData.append('files', submittedFile);  
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

        console.log("업로드 성공:", result);
        console.log("requestId: ", result.requestId);

        // 추천 모델들, 목적, 요약 저장
        setModels(result.model_recommendations);
        setPurpose(result.purpose_understanding);
        setOverview(result.data_overview);
        setRequestId(result.requestId);
        setPage('selectML');

        if (response.status != 200) {
            throw new Error("업로드 실패");
        }

        } catch (error) {
            console.error("에러 발생:", error);

        } finally {
            setIsLoading(false);  
        }

    };

    // selectMl 에서 선택된 모델로 분석 요청
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

            setResult(result); 
            setPage('chatContent'); 
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
                <img src="/img/icon.png" style={styles.icon}/>
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
                            <div key={index} style={styles.menuItem} onClick={() => handleMenuItemClick(chat.chatRoomId)}>
                                <img style={styles.arrow} src="/img/arrow.png" alt="arrow" />
                                <p style={styles.chatList}>{chat.requirement}</p> 
                            </div>
                        ))
                    ): null }
                </div>
            </div>
        </div>

        {/* page 상태에 따른 조건부 렌더링 */}
        {page === 'selectML' && <SelectML chatRoomId={chatRoomId} models={models} purpose={purpose} overview={overview} requestId={requestId} onModelSelect={handleModelSelect} onSubmit={handleSubmit}/>}
        {page === 'chatContent' && <ChatContent file={submittedFile} message={submittedRequirement} result={result}/>}
        {page === 'loading' && <Loading currentStep={currentStep}/>}
        {page === 'fileUploader' && <FileUploader onChangePage={handleChangePage} onSubmitFiles={handleSubmitFiles}/>}
        {page === 'requirementUploader' && <RequirementUploader onChangePage={handleChangePage} onSubmitRequirement={handleSubmitRequirement} onSubmit={handleSubmit}/>} 
        {page === 'loading2' && <Loading/>}
        {page === 'newChat' && <NewChat/>}
    </div>
);

}