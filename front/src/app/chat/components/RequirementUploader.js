import React, { useEffect, useState } from 'react';
import styles from '/styles/requirementUploaderStyle'; 

export default function RequirementUploader({ onSubmitRequirement, onSubmit }) {
    
    const [requirement, setRequirement] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleMessageChange = (event) => {
        setRequirement(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); 
        
        if (requirement.trim() === '') {
            setError("분석을 원하는 내용을 입력해주세요.")
            return; 
        }
        
        onSubmitRequirement(requirement);
        setSubmitted(true);
    };

    useEffect(() => {
        if (submitted) {
            onSubmit();
            setSubmitted(false);
        }
    }, [submitted])

    return (
        <div style={styles.container}>
            {error && (
                    <div style={styles.error}>{error}</div>
                )}
            <div style={styles.inputContainer}>
                <input
                    type="text"
                    style={styles.input}
                    placeholder="분석을 원하는 내용을 입력해주세요."
                    value={requirement}
                    onChange={handleMessageChange} 
                />
                <button
                    type="submit"
                    onClick={handleSubmit} 
                    style={styles.inputButton}
                >
                    입력 완료
                </button>
            </div>
        </div>
    );
}
