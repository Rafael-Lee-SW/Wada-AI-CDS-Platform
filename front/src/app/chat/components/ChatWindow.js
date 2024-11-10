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

export default function Home({ sessionId }) {

    const [submittedFile, setSubmittedFile] = useState([]);
    const [submittedRequirement, setSubmittedRequirement] = useState('');   
    const [requirement, setRequirement] = useState('');
    const [page, setPage] = useState('fileUploader');
    const [models, setModels] = useState([]);
    const [purpose, setPurpose] = useState();
    const [overview, setOverview] = useState();
    const [result, setResult] = useState(null);
    const [chatRoomId, setChatRoomId] = useState('');
    const [chatList, setChatList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const getChatList = async () => {
            try {
                const response = await fetchChatList(sessionId);  
                const chats = response.data; 

                setChatList(chats); 
            } catch (error) {
                console.error("대화 기록 불러오기 실패:", error);
            } 
        };

        getChatList(); 
    }, [sessionId]);

    const handleMenuItemClick = async (chatRoomId) => {
        
        setIsLoading(true); 
        setPage('loading');  

        try {
            const response = await fetchChatRoom(chatRoomId, sessionId);

            const fileUrl = response.data.fileUrl;
            const modelResult = response.data.resultFromModel.result;

            setFiles([fileUrl]);  
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
    }

    const handleSubmitRequirement = async (requirement) => {
        setRequirement(requirement);
    }

    const handleSubmit = async () => {

        if (!files && !requirement) {
            return;
        }

        const newChatRoomId = uuidv4();
        
        setSubmittedFile(files);
        setSubmittedRequirement(requirement);
        setChatRoomId(newChatRoomId);

        const formData = new FormData();

        formData.append("chatRoomId", newChatRoomId);  

        if (Array.isArray(files)) {
            files.forEach((file, index) => {
                formData.append(`file[${index}]`, file);  
            });
        } else {
        formData.append("file", files);  
        } 

        formData.append("requirement", requirement);
        

        console.log("FormData 내용:");
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        setIsLoading(true);  
        setPage('loading');

        try {
            const response = await fetchModel(formData, sessionId);
            const result = response.data;
        
        // 테스트용
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
        //         {
        //             "analysis_name": "Random Forest Classification for Termination Prediction",
        //             "selection_reasoning": "임직원 해고 예측을 위해 가장 적합하며, 다양한 입력 데이터와 복잡한 상호작용을 처리할 수 있습니다. 또, 피처 중요도를 통해 어떤 변수가 해고에 큰 영향을 미치는지 알 수 있습니다.",
        //             "implementation_request": {
        //                 "model_choice": "random_forest_classification",
        //                 "feature_columns": [
        //                     "GenderID",
        //                     "MaritalStatusID",
        //                     "DeptID",
        //                     "PositionID",
        //                     "PerfScoreID",
        //                     "Salary",
        //                     "DaysLateLast30",
        //                     "Absences",
        //                     "EngagementSurvey",
        //                     "EmpSatisfaction"
        //                 ],
        //                 "target_variable": "Termd"
        //             }
        //         },
        //         {
        //             "analysis_name": "Logistic Regression for Attrition Risk Prediction",
        //             "selection_reasoning": "이직 가능성이 높은 직원을 식별하는 데 좋은 해석력을 제공하는 모델입니다. 확률 점수를 통해 이직 위험을 수치로 제시할 수 있습니다.",
        //             "implementation_request": {
        //                 "model_choice": "logistic_regression_attrition",
        //                 "feature_columns": [
        //                     "GenderID",
        //                     "MaritalStatusID",
        //                     "PerfScoreID",
        //                     "Salary",
        //                     "DaysLateLast30",
        //                     "Absences",
        //                     "EngagementSurvey",
        //                     "EmpSatisfaction",
        //                     "SpecialProjectsCount"
        //                 ],
        //                 "target_variable": "Termd"
        //             }
        //         }
        //     ]
        // }

        console.log("업로드 성공:", result);

        // 추천 모델들, 목적, 요약 저장
        setModels(result.model_recommendations);
        setPurpose(result.purpose_understanding);
        setOverview(result.data_overview);
        setPage('selectML');
        setRequirement('');
        setFiles(null);

        if (response.status != 200) {
            throw new Error("업로드 실패");
        }

        } catch (error) {
            console.error("에러 발생:", error);

            setRequirement(''); 
            setFiles(null);

        } finally {
            setIsLoading(false);  
        }

    };

    // selectMl 에서 선택된 모델로 분석 요청
    const handleModelSelect = async (chatRoomId, model) => {

        setIsLoading(true);  
        setPage('loading');

        try {
            const data = {
                "chatRoomId": chatRoomId,
                "modelDetail": model.implementation_request
            }

            const response = await createAnalyze(data, sessionId); 
            // 분석 결과 (형식확인 필요)
            const result = response.result();

            // 최종 분석 결과 저장
            setResult(result); 
            setPage('chatContent'); 

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
                ): '' }
            </div>
        </div>
        <div style={styles.header}>
            <span style={styles.headerMessage} onClick={handleChangeHome}>원하는Da로</span>
        </div>

        {/* page 상태에 따른 조건부 렌더링 */}
        {page === 'default' && <DefaultPage />}
        {page === 'selectML' && <SelectML chatRoomId={chatRoomId} models={models} purpose={purpose} overview={overview} onModelSelect={handleModelSelect} />}
        {page === 'chatContent' && <ChatContent file={submittedFile} message={submittedRequirement} result={result}/>}
        {page === 'loading' && <Loading />}
        {page === 'fileUploader' && <FileUploader onChangePage={handleChangePage} onSubmitFiles={handleSubmitFiles}/>}
        {page === 'requirementUploader' && <RequirementUploader onChangePage={handleChangePage} onSubmitRequirement={handleSubmitRequirement} onSubmit={handleSubmit}/>} 
    </div>
);

}