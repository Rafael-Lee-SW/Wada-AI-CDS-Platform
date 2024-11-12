import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaCheck } from 'react-icons/fa';

const steps = [
    { label: '파일업로드' },
    { label: '사전분석' },
    { label: '모델선택' },
    { label: '분석' },
    { label: '분석완료' },
];

const ProgressBar = ({ currentStep }) => {
    const renderMessage = () => {
        switch (currentStep) {
            case 1:
                return '업로드하신 내용을 바탕으로 사전분석을 수행하는 중이에요. 잠시만 기다려주세요.';
            case 3:
                return '선택하신 모델을 사용해 데이터를 분석하는 중입니다. 잠시만 기다려주세요.';
            default:
                return '';
        }
    };

    return (
        <Overlay>
            <Container>
                <StepsWrapper>
                    {steps.map((step, index) => (
                        <StepContainer key={index}>
                            <Circle
                                $isActive={index === currentStep}
                                $isCompleted={index < currentStep}
                            >
                                {index < currentStep ? <FaCheck /> : index + 1}
                            </Circle>
                            <StepLabel $isActive={index === currentStep}>
                                {step.label}
                            </StepLabel>
                            {index < steps.length - 1 && (
                                <Line $isCompleted={index < currentStep} />
                            )}
                        </StepContainer>
                    ))}
                </StepsWrapper>
                {renderMessage() && <Message>{renderMessage()}</Message>}
            </Container>
        </Overlay>
    );
};

const pulse = keyframes`
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.2);
    }
`;

const Overlay = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px);
    z-index: 9999;
`;

const Container = styled.div`
    background-color: white;
    padding: 30px;
    border-radius: 15px;
    width: 80%;
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
`;

const StepsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20px;
`;

const StepContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
`;

const Circle = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    background-color: ${({ $isActive, $isCompleted }) =>
        $isCompleted ? '#4caf50' : $isActive ? '#9370db' : '#e0e0e0'};
    color: white;
    transition: background-color 0.3s ease, transform 0.3s ease;
    animation: ${({ $isActive }) => ($isActive ? pulse : 'none')} 1.5s infinite;
`;

const Line = styled.div`
    position: absolute;
    width: 100%;
    height: 4px;
    background-color: ${({ $isCompleted }) => ($isCompleted ? '#4caf50' : '#e0e0e0')};
    top: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: -1;
`;

const StepLabel = styled.div`
    margin-top: 10px;
    font-size: 0.9rem;
    font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'normal')};
    color: ${({ $isActive }) => ($isActive ? '#9370db' : '#555')};
    transition: color 0.3s ease;
`;

const Message = styled.div`
    margin-top: 20px;
    font-size: 14px;
    color: #888;
`;

export default ProgressBar;
