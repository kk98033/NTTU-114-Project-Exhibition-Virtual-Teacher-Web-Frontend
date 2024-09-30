// src/components/ExpressionControls.js
import React from 'react';

const ExpressionControls = ({ vrm }) => {
    const handleExpressionChange = (expressionName) => {
        const expressionManager = vrm.expressionManager;
        if (expressionManager) {
            // 重置所有表情
            expressionManager.setValue('smile', 0);
            expressionManager.setValue('angry', 0);
            expressionManager.setValue('sad', 0);
            expressionManager.setValue('idle', 0);
            expressionManager.setValue('happy', 0);
            expressionManager.setValue('surprised', 0);
            expressionManager.setValue('fun', 0);
            expressionManager.setValue('joy', 0);
            expressionManager.setValue('blink', 0);
            expressionManager.setValue('blink_L', 0);
            expressionManager.setValue('blink_R', 0);
            expressionManager.setValue('a', 0);
            expressionManager.setValue('i', 0);
            expressionManager.setValue('u', 0);
            expressionManager.setValue('e', 0);
            expressionManager.setValue('o', 0);

            // 設置選擇的表情
            expressionManager.setValue(expressionName, 1);
        }
    };

    return (
        <div>
            <button onClick={() => handleExpressionChange('smile')}>大笑</button>
            <button onClick={() => handleExpressionChange('angry')}>生氣</button>
            <button onClick={() => handleExpressionChange('sad')}>傷心</button>
            <button onClick={() => handleExpressionChange('idle')}>idle</button>
            <button onClick={() => handleExpressionChange('happy')}>高興</button>
            <button onClick={() => handleExpressionChange('surprised')}>驚訝</button>
            <button onClick={() => handleExpressionChange('fun')}>有趣</button>
            <button onClick={() => handleExpressionChange('joy')}>喜悅</button>
            <button onClick={() => handleExpressionChange('blink')}>眨眼</button>
            <button onClick={() => handleExpressionChange('blink_L')}>左眼眨眼</button>
            <button onClick={() => handleExpressionChange('blink_R')}>右眼眨眼</button>
            <button onClick={() => handleExpressionChange('a')}>A</button>
            <button onClick={() => handleExpressionChange('i')}>I</button>
            <button onClick={() => handleExpressionChange('u')}>U</button>
            <button onClick={() => handleExpressionChange('e')}>E</button>
            <button onClick={() => handleExpressionChange('o')}>O</button>
        </div>
    );
};

export default ExpressionControls;
