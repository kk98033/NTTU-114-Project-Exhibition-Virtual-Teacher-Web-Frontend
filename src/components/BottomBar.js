// src\components\BottomBar.js
import React, { useState, useEffect } from 'react';
import './BottomBar.css';
import { FaMicrophone, FaStop } from 'react-icons/fa';  // 語音和停止的圖示
import { uploadAndProcessAudio } from '../api/voiceChatAPI';
import { useLoading } from './LoadingContext';
import Recorder from 'recorder-js';

const BottomBar = () => {
    const [isRecording, setIsRecording] = useState(false); // 控制錄音狀態
    const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder 物件
    const [audioChunks, setAudioChunks] = useState([]); // 存儲錄音的音訊資料
    const { showLoading, hideLoading } = useLoading(); // 控制 Loading 動畫

    const [recorder, setRecorder] = useState(null);
    const [audioContext, setAudioContext] = useState(null);

    useEffect(() => {
        if (isRecording) {
            // 開始錄音後，設置倒計時自動停止
            const timer = setTimeout(stopRecording, 5000); // 5秒後自動停止錄音
            return () => clearTimeout(timer); // 清除計時器
        }
    }, [isRecording]);

    // 開始錄音
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            setAudioContext(audioCtx);

            const newRecorder = new Recorder(audioCtx);
            newRecorder.init(stream);
            newRecorder.start();

            setRecorder(newRecorder);
            setIsRecording(true);
        } catch (err) {
            console.error("無法訪問麥克風", err);
        }
    };


    // 停止錄音
    const stopRecording = async () => {
        if (recorder) {
            const { blob } = await recorder.stop();
            const audioUrl = URL.createObjectURL(blob);

            // 創建下載連結
            // const downloadLink = document.createElement('a');
            // downloadLink.href = audioUrl;
            // downloadLink.download = 'recorded_audio.wav';
            // downloadLink.click();

            showLoading();
            try {
                // 呼叫 API 發送音訊
                const processedAudioUrl = await uploadAndProcessAudio(blob);

                // 播放處理後的音頻
                const audioElement = new Audio(processedAudioUrl);
                audioElement.play();

                // 提供下載連結
                const processedDownloadLink = document.createElement('a');
                processedDownloadLink.href = processedAudioUrl;
                processedDownloadLink.download = 'processed_audio.wav';
                processedDownloadLink.textContent = '下載處理後的音頻';
                document.body.appendChild(processedDownloadLink);

                console.log('DEBUG: 音頻處理完成，已生成音頻 URL：', processedAudioUrl);
            } catch (error) {
                console.error('DEBUG: 音頻處理失敗：', error.message);
            } finally {
                hideLoading();
            }

            // 重置錄音狀態
            setIsRecording(false);
            setRecorder(null);
            audioContext.close();
        }
    };

    const handleVoiceButtonClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="bottom-bar">
            <button
                className={`voice-button ${isRecording ? 'recording' : ''}`}  // 添加動畫類
                onClick={handleVoiceButtonClick}
            >
                {isRecording ? <FaStop size={100} /> : <FaMicrophone size={100} />} {/* 圖示大小為 100px */}
            </button>
        </div>
    );
};

export default BottomBar;
