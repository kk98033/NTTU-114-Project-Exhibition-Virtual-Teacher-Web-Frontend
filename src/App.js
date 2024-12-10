// src/App.js
import React, { useEffect, useRef, useState } from 'react';
import { FaExpand, FaCompress } from 'react-icons/fa'; // 引入 Font Awesome 的全螢幕圖示
import VRMViewer from './components/VRMViewer';
import ChatBox from './components/ChatBox';
import BottomBar from './components/BottomBar';
import QuickQuestions from './components/QuickQuestions';
import { useLoading } from './components/LoadingContext';
import LoadingOverlay from './components/LoadingOverlay';
import { VRMProvider } from './context/VRMContext';
import { ChatProvider, useChat } from './context/ChatContext';
import './App.css';
import { AnimationSystem } from './utils/AnimationSystem';


function App() {
    const { isLoading } = useLoading();
    const [isFullScreen, setIsFullScreen] = useState(false); // 控制全螢幕狀態

    // 進入全螢幕模式
    const requestFullScreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    };

    // 退出全螢幕模式
    const exitFullScreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };

    // 檢測全螢幕變化
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    // 使用 useEffect 進行權限檢查和初始化
    useEffect(() => {
        // 確保 getUserMedia 可用
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("你的瀏覽器不支持 getUserMedia API，無法使用麥克風");
        }
    }, []);

    return (
        <ChatProvider>
            <VRMProvider>
                <div className="App">
                    {isLoading && <LoadingOverlay show={isLoading} />}
                    <button
                        onClick={isFullScreen ? exitFullScreen : requestFullScreen}
                        className="fullscreen-toggle"
                    >
                        {isFullScreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
                    </button>
                    <VRMViewer />
                    <ChatBox />
                    <QuickQuestions />
                    <BottomBar />
                </div>
            </VRMProvider>
        </ChatProvider>
    );
}

export default App;
