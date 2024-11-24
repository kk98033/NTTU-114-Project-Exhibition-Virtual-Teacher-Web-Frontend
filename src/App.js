// src/App.js
import React, { useEffect } from 'react';
import VRMViewer from './components/VRMViewer';
import ChatBox from './components/ChatBox';
import BottomBar from './components/BottomBar';
import QuickQuestions from './components/QuickQuestions';

function App() {
    // 函數來進入全螢幕模式
    const requestFullScreen = () => {
        const elem = document.documentElement; // 取得整個 HTML 文件作為全螢幕對象
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
    };

    // 使用 useEffect 進行權限檢查和初始化
    useEffect(() => {
        // 嘗試進入全螢幕
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                console.log("Exited fullscreen");
            }
        });

        // 確保 getUserMedia 可用
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("你的瀏覽器不支持 getUserMedia API，無法使用麥克風");
        }
    }, []);

    return (
        <div className="App">
            <button onClick={requestFullScreen} style={{ position: 'absolute', top: '10px', right: '10px', padding: '10px 20px', zIndex: 100 }}>
                進入全螢幕
            </button>
            <VRMViewer />
            <ChatBox />
            <QuickQuestions />
            <BottomBar />
        </div>
    );
}

export default App;
