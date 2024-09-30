// src/components/controlBlendShapes.js
import * as THREE from 'three';

export const controlBlendShapes = (vrm) => {
    const expressionManager = vrm.expressionManager;
    if (!expressionManager) {
        console.error('VRM does not have an expression manager');
        return;
    }

    const blinkInterval = 3; // 每隔 3 秒眨眼一次
    const blinkDuration = 0.2; // 眨眼持續時間（秒）
    let blinkTimer = 0;
    let isBlinking = false;
    let blinkStartTime = 0;

    // 設置持續微笑
    expressionManager.setValue('smile', 1.0);

    const updateExpression = (deltaTime) => {
        blinkTimer += deltaTime;

        if (!isBlinking && blinkTimer >= blinkInterval) {
            isBlinking = true;
            blinkStartTime = blinkTimer;
            expressionManager.setValue('blink', 1.0);
        }

        if (isBlinking && blinkTimer >= blinkStartTime + blinkDuration) {
            expressionManager.setValue('blink', 0.0);
            isBlinking = false;
            blinkTimer = 0;
        }
    };

    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();
        updateExpression(deltaTime);
    };

    animate();
};
