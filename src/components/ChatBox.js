import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';

const ChatBox = () => {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [typingMessage, setTypingMessage] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [responses, setResponses] = useState([]);
    const chatEndRef = useRef(null); // 用來定位聊天的最底部

    // 在 component 載入時讀取 JSON 文件
    useEffect(() => {
        fetch('/responses.json')
            .then(response => response.json())
            .then(data => {
                setResponses(data.responses);
            });
    }, []);

    // 當 chatHistory 更新時自動滾動到最底部
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, typingMessage]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            setChatHistory([...chatHistory, { text: message, sender: "user" }]);
            setMessage("");

            // 顯示「思考中」符號
            setIsThinking(true);

            // 從 responses 中隨機選取一個回應
            const randomIndex = Math.floor(Math.random() * responses.length);
            const botResponse = responses[randomIndex] || { content: ["這是 ChatGPT 的預設回應，未讀取到其他回應。"] };

            let sentenceIndex = 0; // 用於追蹤哪一句話正在輸出
            let wordIndex = 0; // 用於逐字打出每一句話
            let currentSentence = botResponse.content[sentenceIndex]; // 取得當前句子
            setTypingMessage(""); // 清空目前的打字狀態

            const typeOutMessage = () => {
                // 當句子包含 "Action" 或 "Action Input" 時，立即顯示整句
                if (currentSentence.includes("Action") || currentSentence.includes("Action Input")) {
                    setChatHistory((prevHistory) => [...prevHistory, { text: currentSentence, sender: "bot" }]);
                    sentenceIndex++;
                    if (sentenceIndex < botResponse.content.length) {
                        currentSentence = botResponse.content[sentenceIndex] || ""; // 更新到下一句
                        wordIndex = 0; // 重置 wordIndex
                        setTypingMessage(""); // 清空 typingMessage
                        setTimeout(typeOutMessage, 500); // 繼續處理下一句話
                    } else {
                        setIsThinking(false); // 結束思考過程
                    }
                }
                // 如果是 Observation，快速顯示，但加長前的思考時間
                else if (currentSentence.includes("Observation")) {
                    if (wordIndex === 0) {
                        setTimeout(() => {
                            typeOutMessage(); // 延遲結束後再進行逐字輸出
                        }, Math.random() * (4000 - 3000) + 3000); // 加長思考時間
                        return;
                    }

                    // 逐字快速輸出 Observation
                    if (wordIndex < currentSentence.length) {
                        setTypingMessage((prev) => prev + currentSentence[wordIndex]);
                        wordIndex++;
                        setTimeout(typeOutMessage, Math.random() * (50 - 30) + 30); // 加快字輸出速度
                    } else if (sentenceIndex < botResponse.content.length - 1) {
                        // 當前句子打完，將整句添加到 chatHistory 中，繼續下一句話
                        setChatHistory((prevHistory) => [...prevHistory, { text: currentSentence, sender: "bot" }]);
                        sentenceIndex++;
                        currentSentence = botResponse.content[sentenceIndex]; // 更新當前句子
                        wordIndex = 0;
                        setTypingMessage(""); // 清空打字狀態，準備下一句
                        setTimeout(typeOutMessage, Math.random() * (2000 - 500) + 500); // 延遲更長的時間開始下一句話
                    } else {
                        // 全部句子打完，更新 chatHistory，並隱藏「思考中」
                        setChatHistory((prevHistory) => [...prevHistory, { text: currentSentence, sender: "bot" }]);
                        setTypingMessage(""); // 清空 typingMessage
                        setIsThinking(false); // 打字完成後隱藏「思考中」提示
                    }
                }
                // 正常逐字輸出
                else if (wordIndex < currentSentence.length) {
                    setTypingMessage((prev) => prev + currentSentence[wordIndex]);
                    wordIndex++;
                    setTimeout(typeOutMessage, Math.random() * (150 - 100) + 100); // 隨機間隔，字輸出速度減慢
                } else if (sentenceIndex < botResponse.content.length - 1) {
                    // 當前句子打完，將整句添加到 chatHistory 中，繼續下一句話
                    setChatHistory((prevHistory) => [...prevHistory, { text: currentSentence, sender: "bot" }]);
                    sentenceIndex++;
                    currentSentence = botResponse.content[sentenceIndex]; // 更新當前句子
                    wordIndex = 0;
                    setTypingMessage(""); // 清空打字狀態，準備下一句
                    setTimeout(typeOutMessage, Math.random() * (2000 - 500) + 500); // 延遲更長的時間開始下一句話
                } else {
                    // 全部句子打完，更新 chatHistory，並隱藏「思考中」
                    setChatHistory((prevHistory) => [...prevHistory, { text: currentSentence, sender: "bot" }]);
                    setTypingMessage(""); // 清空 typingMessage
                    setIsThinking(false); // 打字完成後隱藏「思考中」提示
                }
            };

            setTimeout(typeOutMessage, Math.random() * (3000 - 1000) + 1000); // 延遲思考過程，模擬自然反應
        }
    };

    return (
        <div className="chat-box">
            <div className="chat-history">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                {typingMessage && (
                    <div className="chat-message bot">
                        {typingMessage}
                    </div>
                )}
                {isThinking && (
                    <div className="thinking-indicator">
                        <span className="spinner"></span> 思考中...
                    </div>
                )}
                <div ref={chatEndRef} /> {/* 聊天框的最底部參考點 */}
            </div>
            <div className="input-area">
                <input
                    type="text"
                    className="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendMessage} className="send-button">Send</button>
            </div>
        </div>
    );
};

export default ChatBox;
