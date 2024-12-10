import { loadVRMAnimation } from "./animationUtils";

export const syncMouthAnimation = (audioUrl, vrm, loadAnimation) => {

    if (!vrm || !vrm.expressionManager) {
        console.error('VRM 模型或表情管理器未正確加載');
        return;
    }

    loadAnimation('/animations/Talking.fbx', 1.0);

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const audioElement = new Audio(audioUrl);
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let smileTimer; // 計時器，用於控制隨機微笑動畫

    const maxMouthOpen = {
        aa: 0.5, // 最大嘴巴張開比例
        ih: 1, // 最大 'ih' 張開比例
        ou: 0.5, // 最大 'ou' 張開比例
        ee: 0.6, // 最大 'ee' 張開比例
        oh: 0.6, // 最大 'oh' 張開比例
    };
    
    const enhancementFactor = {
        ih: 2, // 放大 ih 的效果
        ou: 1.5, // 放大 ou 的效果
        ee: 1.5, // 放大 ee 的效果
        oh: 1.5, // 放大 oh 的效果
    };
    
    const smoothingFactor = 0.8; // 平滑因子，用於移動平均
    let smoothedLow = 0;
    let smoothedMid = 0;
    let smoothedHigh = 0;
    
    const updateMouthAnimation = () => {
        analyser.getByteFrequencyData(dataArray);
    
        // 計算不同頻段的能量
        const lowFreq = dataArray.slice(0, 32).reduce((sum, value) => sum + value, 0) / 32; // 低頻
        const midFreq = dataArray.slice(32, 64).reduce((sum, value) => sum + value, 0) / 32; // 中頻
        const highFreq = dataArray.slice(64, 128).reduce((sum, value) => sum + value, 0) / 64; // 高頻
    
        // 平滑頻率數據
        smoothedLow = smoothedLow * smoothingFactor + lowFreq * (1 - smoothingFactor);
        smoothedMid = smoothedMid * smoothingFactor + midFreq * (1 - smoothingFactor);
        smoothedHigh = smoothedHigh * smoothingFactor + highFreq * (1 - smoothingFactor);
    
        // 正規化頻率數據並應用最大值限制
        const normalizedLow = Math.min(smoothedLow / 128.0, 1.0);
        const normalizedMid = Math.min(smoothedMid / 128.0, 1.0);
        const normalizedHigh = Math.min(smoothedHigh / 128.0, 1.0);
    
        const aaValue = Math.min(normalizedLow, maxMouthOpen.aa); // 限制 'aa'
        const ihValue = Math.min(normalizedMid * enhancementFactor.ih, maxMouthOpen.ih); // 限制 'ih'
        const ouValue = Math.min(normalizedMid * enhancementFactor.ou, maxMouthOpen.ou); // 限制 'ou'
        const eeValue = Math.min(normalizedHigh * enhancementFactor.ee, maxMouthOpen.ee); // 限制 'ee'
        const ohValue = Math.min(normalizedHigh * enhancementFactor.oh, maxMouthOpen.oh); // 限制 'oh'
    
        // 根據頻段控制音素動畫
        vrm.expressionManager.setValue('aa', aaValue); // 低頻對應 'aa'
        vrm.expressionManager.setValue('ih', ihValue); // 中頻對應 'ih'
        vrm.expressionManager.setValue('ou', ouValue); // 中頻對應 'ou'
        vrm.expressionManager.setValue('ee', eeValue); // 高頻對應 'ee'
        vrm.expressionManager.setValue('oh', ohValue); // 高頻對應 'oh'
    
        // 繼續監控音頻數據
        requestAnimationFrame(updateMouthAnimation);
    };
    
    const playSmileAnimation = () => {
        if (Math.random() > 0.5) { // 50% 機率觸發
            vrm.expressionManager.setValue('happy', 0.1); // 微笑

            // 恢復原狀
            setTimeout(() => {
                vrm.expressionManager.setValue('happy', 0.0); // 停止微笑
            }, 1000); // 動畫持續 1 秒
        }

        // 設置下一次隨機觸發
        smileTimer = setTimeout(playSmileAnimation, Math.random() * 2000 + 1000); // 1 到 3 秒之間隨機觸發
    };

    audioElement.addEventListener('play', () => {
        audioContext.resume();
        updateMouthAnimation();

        // 啟動隨機微笑動畫
        smileTimer = setTimeout(playSmileAnimation, Math.random() * 2000 + 1000);
    });

    audioElement.addEventListener('pause', () => {
        clearTimeout(smileTimer); // 停止隨機微笑動畫
    });

    audioElement.addEventListener('ended', () => {
        clearTimeout(smileTimer); // 確保計時器被清除
    
        const duration = 200; // 微笑過渡持續時間 (毫秒)
        const fps = 60; // 過渡的幀率
        const totalFrames = Math.round(duration / (1000 / fps)); // 計算總幀數
        let currentFrame = 0; // 當前幀數
    
        // 緩慢增加微笑表情
        const incrementSmile = () => {
            if (currentFrame < totalFrames) {
                const progress = currentFrame / totalFrames; // 當前進度 [0, 1]
                const smileValue = 0.8 * progress; // 緩慢增加到 0.8
                vrm.expressionManager.setValue('happy', smileValue);
                currentFrame++;
                requestAnimationFrame(incrementSmile); // 下一幀
            } else {
                // 開始緩慢減少微笑表情
                setTimeout(() => {
                    currentFrame = 0; // 重置幀數
                    const decrementSmile = () => {
                        if (currentFrame < totalFrames) {
                            const progress = currentFrame / totalFrames; // 當前進度 [0, 1]
                            const smileValue = 0.8 * (1 - progress); // 緩慢減少到 0
                            vrm.expressionManager.setValue('happy', smileValue);
                            currentFrame++;
                            requestAnimationFrame(decrementSmile); // 下一幀
                        }
                    };
                    decrementSmile();
                }, 1500); // 保持微笑一段時間後再減少
            }
        };
    
        incrementSmile(); // 啟動微笑動畫

        // 觸發回到 idle 動畫
        loadAnimation('/animations/idle.fbx');
        loadVRMAnimation('animations/vrma/VRMA_02.vrma');
    });
    

    audioElement.play().catch((error) => {
        console.error('音頻播放失敗:', error);
    });
};
