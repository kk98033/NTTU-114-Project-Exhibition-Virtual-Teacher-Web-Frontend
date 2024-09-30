// src/components/VoiceExpressionControls.js
import React from 'react';

const VoiceExpressionControls = ({ vrm }) => {
    const handleVoiceExpressionChange = (expressionName) => {
        const expressionManager = vrm.expressionManager;
        if (expressionManager) {
            // 重置所有聲音表情
            expressionManager.setValue('a', 0);
            expressionManager.setValue('i', 0);
            expressionManager.setValue('u', 0);
            expressionManager.setValue('e', 0);
            expressionManager.setValue('o', 0);

            // 設置選擇的聲音表情
            expressionManager.setValue(expressionName, 1);
        }
    };

    return (
        <div>
            <button onClick={() => handleVoiceExpressionChange('a')}>A</button>
            <button onClick={() => handleVoiceExpressionChange('i')}>I</button>
            <button onClick={() => handleVoiceExpressionChange('u')}>U</button>
            <button onClick={() => handleVoiceExpressionChange('e')}>E</button>
            <button onClick={() => handleVoiceExpressionChange('o')}>O</button>
        </div>
    );
};

export default VoiceExpressionControls;
