import React, { useEffect, useRef } from 'react';
import './ChatBox.css';
import { useChat } from '../context/ChatContext';

const ChatBox = () => {
    const { chatHistory } = useChat(); // 使用上下文中的聊天記錄
    const chatEndRef = useRef(null);

    // 滾動到最新消息
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="chat-box">
            <div className="chat-history">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
        </div>
    );
};

export default ChatBox;
