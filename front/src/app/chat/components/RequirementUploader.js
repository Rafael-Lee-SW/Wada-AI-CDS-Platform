import React, { useState } from 'react';
import styles from '/styles/chatWindowStyle'; // Assuming you have some styles defined.

export default function RequirementUploader({ onChangePage }) {
    // State to manage the message input
    const [message, setMessage] = useState('');

    // Handle the input change
    const handleMessageChange = (event) => {
        setMessage(event.target.value);
    };

    // Handle the submit action (for sending the message)
    const handleSubmit = (event) => {
        event.preventDefault(); // Prevent form refresh
        if (message.trim() === '') {
            return; // Don't do anything if the input is empty
        }
        // Implement the logic to send the message
        console.log("Message sent:", message);

        // Optionally, reset the input field after sending
        setMessage('');
    };

    return (
        <div style={styles.inputWrapper}>
            <div style={styles.inputContainer}>
                {/* Text input for the message */}
                <input
                    type="text"
                    style={styles.input}
                    placeholder="메시지를 입력해주세요."
                    value={message}
                    onChange={handleMessageChange} // Update state on change
                />
                
                {/* Send Button */}
                <button
                    type="submit"
                    onClick={handleSubmit} // Trigger the submit action on click
                    style={styles.inputButton}
                >
                    전송
                </button>
            </div>
        </div>
    );
}
