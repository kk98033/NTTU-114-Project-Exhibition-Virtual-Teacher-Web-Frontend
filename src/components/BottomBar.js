// src\components\BottomBar.js
import React, { useState, useEffect } from 'react';
import './BottomBar.css';
import { FaMicrophone, FaStop } from 'react-icons/fa';  // 語音和停止的圖示
import { uploadAndProcessAudio } from '../api/voiceChatAPI';
import { useLoading } from './LoadingContext';
import Recorder from 'recorder-js';
import { playProcessedAudioWithMouthAnimation } from './VRMViewer';
import { syncMouthAnimation } from '../utils/syncMouthAnimation';
import { useVRM } from '../context/VRMContext';
import { useChat } from '../context/ChatContext';
import { AnimationSystem } from '../utils/AnimationSystem';

export const processAudioForMouthAnimation = (audioUrl, vrm) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const audioElement = new Audio(audioUrl);
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMouthAnimation = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length; // 計算平均振幅
        const mouthOpenValue = Math.min(volume / 128.0, 1.0); // 規範化振幅值到 [0, 1]

        // 控制 VRM 的嘴巴 blendshape
        if (vrm.expressionManager) {
            vrm.expressionManager.setValue('aa', mouthOpenValue); // 'aa' 是嘴巴開合的 blendshape
        }
        requestAnimationFrame(updateMouthAnimation);
    };

    audioElement.addEventListener('play', () => {
        audioContext.resume();
        updateMouthAnimation();
    });

    audioElement.play();
};

const BottomBar = () => {
    const { currentVrmRef, loadAnimation, loadVRMAnimation  } = useVRM(); // 使用共享的 currentVrmRef
    const [isRecording, setIsRecording] = useState(false); // 控制錄音狀態
    const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder 物件
    const [audioChunks, setAudioChunks] = useState([]); // 存儲錄音的音訊資料
    const { showLoading, hideLoading } = useLoading(); // 控制 Loading 動畫
    const { addMessage, cycleBackgroundImage } = useChat(); 

    const [recorder, setRecorder] = useState(null);
    const [audioContext, setAudioContext] = useState(null);

    const imageList = [
        '/images/1.JPG',
        '/images/2.gif',
        '/images/3.jpg',
        '/images/4.JPG',
        '/images/5.PNG',
        '/images/6.jpg',
    ];
    const [bgImageIndex, setBgImageIndex] = useState(0);

    useEffect(() => {
        if (isRecording) {
            // 開始錄音後，設置倒計時自動停止
            const timer = setTimeout(stopRecording, 10000); // 10秒後自動停止錄音
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
            cycleBackgroundImage();
        } catch (err) {
            console.error("無法訪問麥克風", err);
        }
    };


    // 停止錄音
    const stopRecording = async () => {
        if (recorder) {
            // 重置錄音狀態
            setIsRecording(false);
            setRecorder(null);
            audioContext.close();

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
                // const processedAudioUrl = await uploadAndProcessAudio(blob);
                const { audioUrl, responseText, parsedResponse, transcription } = await uploadAndProcessAudio(blob);

                console.log()
                console.log()
                console.log("音頻 URL:", audioUrl);
                console.log("轉錄文字:", transcription);
                console.log("回應文字:", responseText);
                console.log("解析結果:", parsedResponse);
                console.log()
                console.log()

                // 添加用戶消息和機器人回應到上下文
                addMessage(transcription, "user");
                addMessage(responseText, "bot");
                

                // 播放處理後的音頻
                // const audio = new Audio(audioUrl);
                // audio.play();

                // 如果 `parsedResponse` 為 3，執行背景圖片切換和動畫播放
                if (parsedResponse.action === 3) {
                    console.log('| 觸發背景圖片切換和動畫播放 |');

                    // 切換背景圖片
                    cycleBackgroundImage(); // 調用上下文的背景圖片切換功能

                    // 播放特別動畫
                    const animationSystem = new AnimationSystem(loadAnimation, loadVRMAnimation);
                    animationSystem.playStartWithIdleAndSpecialAnimations();
                }

                syncMouthAnimation(audioUrl, currentVrmRef.current, loadAnimation, loadVRMAnimation); // 使用共享的 currentVrmRef

                // 播放處理後的音頻
                const audioElement = new Audio(audioUrl);
                // audioElement.play();

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

            
        }
    };

    const testAudioLoop = () => {
        const audioUrl = '/test_audios/output.ogg'; // 指向測試音頻檔案
    
        // 每次測試重新啟動音頻和嘴巴同步邏輯
        if (currentVrmRef.current) {
            syncMouthAnimation(audioUrl, currentVrmRef.current, loadAnimation, loadVRMAnimation);
        }
    
        console.log('測試音頻開始循環播放');
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
                className={`voice-button ${isRecording ? 'recording' : ''}`} 
                onClick={handleVoiceButtonClick}
            >
                {isRecording ? <FaStop size={50} /> : <FaMicrophone size={50} />}
            </button>
            {/* <button
                className="test-button" // 添加一個新的類名
                onClick={testAudioLoop} // 綁定測試邏輯
            >
                測試音頻循環播放
            </button> */}
        </div>
    );
};

export default BottomBar;
