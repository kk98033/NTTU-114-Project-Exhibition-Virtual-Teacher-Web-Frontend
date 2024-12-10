import React from 'react';
import './QuickQuestions.css';
import { uploadAndProcessAudio } from '../api/voiceChatAPI';
import { useChat } from '../context/ChatContext'; // 使用聊天上下文
import { useLoading } from './LoadingContext'; // 使用 Loading 狀態

const QuickQuestions = () => {
    const { addMessage } = useChat(); // 添加用戶和機器人的消息
    const { showLoading, hideLoading } = useLoading(); // 控制 Loading 動畫

    const handleQuestionClick = async (audioPath) => {
        try {
            showLoading();

            // 讀取音頻文件
            const fileResponse = await fetch(audioPath);
            const audioBlob = await fileResponse.blob();

            // 呼叫 API，處理音頻文件
            const { audioUrl, responseText, parsedResponse, transcription } = await uploadAndProcessAudio(audioBlob);

            console.log("音頻 URL:", audioUrl);
            console.log("轉錄文字:", transcription);
            console.log("回應文字:", responseText);
            console.log("解析結果:", parsedResponse);

            // 添加消息到聊天記錄
            addMessage(transcription, "user"); // 用戶的問題
            addMessage(responseText, "bot"); // 機器人的回應

            // 播放處理後的音頻
            const audioElement = new Audio(audioUrl);
            audioElement.play();

            // 提供下載連結
            const processedDownloadLink = document.createElement('a');
            processedDownloadLink.href = audioUrl;
            processedDownloadLink.download = 'processed_audio.wav';
            processedDownloadLink.textContent = '下載處理後的音頻';
            document.body.appendChild(processedDownloadLink);

            console.log('DEBUG: 音頻處理完成，已生成音頻 URL：', audioUrl);
        } catch (error) {
            console.error('DEBUG: 音頻處理失敗：', error.message);
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="quick-questions">
            <button
                className="question-button"
                onClick={() => handleQuestionClick("/test_audios/quick_questions/1.mp3")}
            >
                你好
            </button>
            <button
                className="question-button"
                onClick={() => handleQuestionClick("/test_audios/quick_questions/2.mp3")}
            >
                告訴我台灣原住民的知識
            </button>
            <button
                className="question-button"
                onClick={() => handleQuestionClick("/test_audios/quick_questions/3.mp3")}
            >
                台灣原住民有幾族
            </button>
        </div>
    );
};

export default QuickQuestions;
