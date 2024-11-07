// components/ProgressBar.js
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const steps = [
    { label: '분석 요청', progress: 25 },
    { label: '최적분석탐색', progress: 50 },
    { label: '모델분석', progress: 75 },
    { label: '보고서', progress: 100 },
];

const ProgressBar = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prevStep) => (prevStep + 1) % steps.length);
        }, 3000);  // 3초 간격으로 단계 진행

        return () => clearInterval(interval);
    }, []);

    return (
        <Container>
            <ProgressWrapper>
                <ProgressFill progress={steps[currentStep].progress} />
            </ProgressWrapper>
            <StepsWrapper>
                {steps.map((step, index) => (
                    <Step key={index} isActive={index === currentStep}>
                        {step.label}
                    </Step>
                ))}
            </StepsWrapper>
        </Container>
    );
};

// 스타일 컴포넌트
const Container = styled.div`
    width: 80%;
    margin: 20px auto;
    text-align: center;
`;

const ProgressWrapper = styled.div`
    width: 100%;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 20px;
`;

const ProgressFill = styled.div`
    height: 100%;
    width: ${({ progress }) => progress}%;
    background-color: #4caf50;
    transition: width 1s ease;
`;

const pulse = keyframes`
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
`;

const StepsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Step = styled.div`
    font-size: 1rem;
    font-weight: ${({ isActive }) => (isActive ? 'bold' : 'normal')};
    animation: ${({ isActive }) => (isActive ? pulse : 'none')} 1s infinite;
    color: ${({ isActive }) => (isActive ? '#4caf50' : '#888')};
    transition: font-size 0.3s ease;
`;

export default ProgressBar;
