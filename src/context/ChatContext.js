// src\context\ChatContext.js
import React, { createContext, useState, useContext } from 'react';

// 創建上下文
const ChatContext = createContext();

// 提供上下文的組件
export const ChatProvider = ({ children }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [bgImageIndex, setBgImageIndex] = useState(0);

    const imageList = [
        '/images/1.JPG',
        '/images/2.gif',
        '/images/3.jpg',
        '/images/4.JPG',
        '/images/5.PNG',
        '/images/6.jpg',
    ];

    // 新增聊天消息
    const addMessage = (message, sender) => {
        setChatHistory((prevHistory) => [...prevHistory, { text: message, sender }]);
    };

    // 清空聊天記錄
    const clearMessages = () => {
        setChatHistory([]);
    };

    // 更換背景圖片
    const cycleBackgroundImage = () => {
        const newIndex = (bgImageIndex + 1) % imageList.length; // 使用當前狀態計算新索引
        setBgImageIndex(newIndex); // 更新狀態
        document.body.style.backgroundImage = `url(${imageList[newIndex]})`; // 更新背景圖片
    };

    return (
        <ChatContext.Provider
            value={{
                chatHistory,
                addMessage,
                clearMessages,
                cycleBackgroundImage,
                bgImageIndex, // 傳遞背景索引
                imageList,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

// 自訂 hook 方便使用上下文
export const useChat = () => {
    return useContext(ChatContext);
};
