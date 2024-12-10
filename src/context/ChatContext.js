// src\context\ChatContext.js
import React, { createContext, useState, useContext } from 'react';

// 創建上下文
const ChatContext = createContext();

// 提供上下文的組件
export const ChatProvider = ({ children }) => {
    const [chatHistory, setChatHistory] = useState([]);

    // 新增聊天消息
    const addMessage = (message, sender) => {
        setChatHistory((prevHistory) => [...prevHistory, { text: message, sender }]);
    };

    return (
        <ChatContext.Provider value={{ chatHistory, addMessage }}>
            {children}
        </ChatContext.Provider>
    );
};

// 自訂 hook 方便使用上下文
export const useChat = () => {
    return useContext(ChatContext);
};
