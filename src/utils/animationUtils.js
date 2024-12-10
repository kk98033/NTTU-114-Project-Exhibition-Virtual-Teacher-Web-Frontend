// src/utils/animationUtils.js
import * as THREE from 'three';
import { loadMixamoAnimation } from '../components/loadMixamoAnimation';

export const applyFBXAnimation = (animationUrl, vrm, mixerRef) => {
    if (!vrm) {
        console.error('尚未加載 VRM 模型');
        return;
    }

    loadMixamoAnimation(animationUrl, vrm)
        .then((clip) => {
            console.log('FBX 動畫加載成功');

            if (!mixerRef.current) {
                mixerRef.current = new THREE.AnimationMixer(vrm.scene);
            }

            const mixer = mixerRef.current;
            
            // 限制動畫只影響脖子以下
            const headBone = vrm.humanoid.getBoneNode('head');
            const neckBone = vrm.humanoid.getBoneNode('neck');
            if (headBone) headBone.matrixAutoUpdate = false;
            if (neckBone) neckBone.matrixAutoUpdate = false;

            // 停止所有現有動作
            mixer.stopAllAction();

            // 播放新動畫
            const newAction = mixer.clipAction(clip);
            newAction.reset().play(); // 直接播放新動畫

            console.log('新動畫已切換:', animationUrl);
        })
        .catch((error) => {
            console.error('FBX 動畫加載失敗:', error);
        });
};



// // 限制動畫只影響脖子以下
// const headBone = vrm.humanoid.getBoneNode('head');
// const neckBone = vrm.humanoid.getBoneNode('neck');
// if (headBone) headBone.matrixAutoUpdate = false;
// if (neckBone) neckBone.matrixAutoUpdate = false;