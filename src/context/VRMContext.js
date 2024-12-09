import React, { createContext, useRef, useContext } from 'react';

const VRMContext = createContext();

export const VRMProvider = ({ children }) => {
    const currentVrmRef = useRef(null); // 定義共享的 currentVrmRef

    return (
        <VRMContext.Provider value={{ currentVrmRef }}>
            {children}
        </VRMContext.Provider>
    );
};

export const useVRM = () => {
    return useContext(VRMContext);
};
