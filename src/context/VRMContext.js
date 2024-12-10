// src/context/VRMContext.js
import React, { createContext, useRef, useContext } from 'react';
import { applyFBXAnimation, loadVRMAnimation } from '../utils/animationUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';

const VRMContext = createContext();

export const VRMProvider = ({ children }) => {
    const currentVrmRef = useRef(null); // 共享 VRM 模型引用
    const mixerRef = useRef(null); // 動畫混合器引用
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    // 封裝 loadAnimation 函數
    const loadAnimation = (animationUrl) => {
        if (!currentVrmRef.current) {
            console.error('VRM 模型未加載，無法套用動畫');
            return;
        }
        applyFBXAnimation(animationUrl, currentVrmRef.current, mixerRef);
    };

    // 封裝 loadVRMAnimation 函數
    const loadVRMAnimationFunc = (animationUrl) => {
        if (!currentVrmRef.current) {
            console.error('VRM 模型未加載，無法套用 VRMA 動畫');
            return;
        }
        loadVRMAnimation(animationUrl, currentVrmRef.current, mixerRef, loader);
    };

    return (
        <VRMContext.Provider value={{ currentVrmRef, mixerRef, loadAnimation, loadVRMAnimation: loadVRMAnimationFunc }}>
            {children}
        </VRMContext.Provider>
    );
};

export const useVRM = () => {
    return useContext(VRMContext);
};
