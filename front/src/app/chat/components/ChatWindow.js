import styles from "/styles/chatWindowStyle"; 
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"
import DefaultPage from "./DefaultPage";
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

    useEffect(() => {
        const getChatList = async () => {
            try {
                const response = await fetchChatList(sessionId);  
                const chats = response.data.slice(0,10); 

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
            console.log(response.data);
            const modelResult = response.data.resultFromModel.result;

            setSubmittedFile([fileUrl]);  
            setResult(modelResult);

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
        console.log(chatRoomId);
        console.log(files);
        console.log(requirement);

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
        
        // // 테스트용
        // const result = {
        //     "purpose_understanding": {
        //         "main_goal": "회사의 인원을 30% 감축하여 인건비를 줄이고자 합니다.",
        //         "specific_requirements": [
        //             "어떤 직원들이 유지되어야 하는지와 감축될 수 있는지를 확인하기 위한 해고 위험 예측 모델",
        //             "현재 고용된 직원들 중, 이직 가능성이 높은 직원들을 선별"
        //         ],
        //         "expected_outcomes": [
        //             "해고하거나 유지할 직원들을 식별하는 데 도움이 되는 분석 결과",
        //             "이직 가능성이 높은 직원들에 대한 예측을 바탕으로 인원 감축 전략 수립"
        //         ]
        //     },
        //     "data_overview": {
        //         "structure_summary": "총 37개의 칼럼으로 구성된 직원 데이터이며, 주로 인구 통계, 직무, 성과, 고용 상태 데이터로 이루어져 있습니다.",
        //         "key_characteristics": [
        //             "다양한 인구 통계 칼럼: 'GenderID', 'MaritalStatusID', 'RaceDesc' 등이 포함됨",
        //             "고용 상태 관련 데이터: 'DeptID', 'PositionID', 'EmpStatusID'",
        //             "성과 평가 및 참여도 관련 칼럼: 'PerfScoreID', 'EngagementSurvey', 'EmpSatisfaction'"
        //         ],
        //         "relevant_columns": [
        //             "EmpStatusID",
        //             "PerfScoreID",
        //             "Salary",
        //             "DaysLateLast30",
        //             "Absences",
        //             "EngagementSurvey",
        //             "EmpSatisfaction"
        //         ]
        //     },
        //     "model_recommendations": [
        //     {
        //         "analysis_name": "random_forest_regression",
        //         "selection_reasoning": "이 모델은 공장 운영 비율 및 리스크 관련 데이터를 기반으로 생산량, 비용 등의 연속적 수치를 예측하는 데 적합합니다. Random Forest Regression은 개별 변수의 중요도를 평가할 수 있어 비즈니스 의사결정에 유용할 가능성이 높습니다.",
        //         "expected_outcome": "운영 효율성에 대한 정확한 예측을 통해 불필요한 비용을 절감하고 생산성 향상을 도모할 수 있습니다.",
        //         "feature_columns": [
        //             "Factory Operating Rate (%)",
        //             "Production Downtime Rate (%)",
        //             "Role Criticality Score",
        //             "Shift Flexibility Score",
        //             "Team Coordination Score",
        //             "Job Role Coverage (%)"
        //         ],
        //         "target_variable": "Production Volume (units)"
        //     },
        //     {
        //         "analysis_name": "kmeans_clustering_anomaly_detection",
        //         "selection_reasoning": "많은 예측 불가능한 특성을 가진 데이터에서 비정상적이거나 예상치 못한 패턴을 파악하는 데 적합합니다. KMeans 클러스터링은 비지도 학습으로 데이터의 구조를 이해하는 데 큰 도움을 줄 수 있습니다.",
        //         "expected_outcome": "운영 및 생산성 데이터에서 일반적인 패턴과 벗어난 비정상적인 활동이나 동향을 발견하여 빠르게 대응할 수 있는 기반을 마련합니다.",
        //         "feature_columns": [
        //             "Process Bottleneck Potential (%)",
        //             "Operational Risk Factor",
        //             "Error Rate Increase (%)",
        //             "Absence Cost Impact ($)"
        //         ],
        //         "optional_parameters": {
        //             "num_clusters": 4
        //         }
        //     }
        // ],
        // }

        console.log("업로드 성공:", result);
        console.log("requestId", result.requestId);

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
    const handleModelSelect = async (chatRoomId, model, requestId) => {

        console.log(chatRoomId);
        console.log(requestId);
        console.log(model.implementation_request);
        setCurrentStep(3);
        setIsLoading(true);  
        setPage('loading');

        try {
            const data = {
                "chatRoomId": chatRoomId,
                "requestId": parseInt(requestId),
                "modelDetail": model.implementation_request
            }

            const jsonData = JSON.stringify(data);

            const response = await createAnalyze(jsonData, sessionId); 
            const result = response.data;

            // 최종 분석 결과 저장
            setResult(result); 
            setPage('chatContent'); 
            console.log("최종 데이터", result);

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
            <div style={styles.userInfo}>
                <div style={styles.avatar}>
                    <img style={styles.profile} src="/img/profile.png" alt="profile" />
                    <span>이한솔</span>
                </div>
            </div>
            <div style={styles.menu}>
                <div style={styles.menuItemTitle}>
                    <p>분석 기록</p>
                </div>
                {chatList.length > 0 ? ( 
                    chatList.map((chat, index) => (
                        <div key={index} style={styles.menuItem} onClick={() => handleMenuItemClick(chat.chatRoomId)}>
                            <img style={styles.arrow} src="/img/arrow.png" alt="arrow" />
                            <p style={styles.chatList}>{chat.requirement}</p> 
                        </div>
                    ))
                ): null }
                <div style={styles.newButtonContainer}>
                    <button style={styles.newButton} onClick={handleChatRoomId}>+ 새 채팅</button>
                </div>
            </div>
        </div>
        <div style={styles.header}>
            <span style={styles.headerMessage} onClick={handleChangeHome}>원하는Da로</span>
        </div>

        {/* page 상태에 따른 조건부 렌더링 */}
        {page === 'default' && <DefaultPage />}
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