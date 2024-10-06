import React, { useState, useEffect } from 'react';
import './BottomBar.css';
import { FaMicrophone, FaStop } from 'react-icons/fa';  // 語音和停止的圖示

const BottomBar = () => {
    const [isRecording, setIsRecording] = useState(false); // 控制錄音狀態
    const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder 物件
    const [audioChunks, setAudioChunks] = useState([]); // 存儲錄音的音訊資料

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
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            const chunks = [];
            recorder.ondataavailable = (e) => chunks.push(e.data); // 存儲音訊數據

            recorder.start();
            setAudioChunks(chunks); // 重置音訊數據
            setIsRecording(true);
        } catch (err) {
            console.error("無法訪問麥克風", err);
        }
    };

    // 停止錄音
    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play(); // 播放錄音的音頻

                // 重置錄音狀態
                setIsRecording(false);
                setMediaRecorder(null);
            };
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
