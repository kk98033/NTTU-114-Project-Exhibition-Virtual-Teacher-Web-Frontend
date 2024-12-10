// src/context/VRMContext.js
import React, { createContext, useRef, useContext } from 'react';
import { applyFBXAnimation } from '../utils/animationUtils';

const VRMContext = createContext();

export const VRMProvider = ({ children }) => {
    const currentVrmRef = useRef(null); // 共享 VRM 模型引用
    const mixerRef = useRef(null); // 動畫混合器引用

    // 封裝 loadAnimation 函數
    const loadAnimation = (animationUrl) => {
        if (!currentVrmRef.current) {
            console.error('VRM 模型未加載，無法套用動畫');
            return;
        }
        applyFBXAnimation(animationUrl, currentVrmRef.current, mixerRef);
    };

    return (
        <VRMContext.Provider value={{ currentVrmRef, mixerRef, loadAnimation }}>
            {children}
        </VRMContext.Provider>
    );
};

export const useVRM = () => {
    return useContext(VRMContext);
};
