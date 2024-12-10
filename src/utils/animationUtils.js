// src/utils/animationUtils.js
import * as THREE from 'three';
import { createVRMAnimationClip } from '@pixiv/three-vrm-animation';

/**
 * 加載並應用 .fbx 動畫
 */
export const applyFBXAnimation = (animationUrl, vrm, mixerRef) => {
    if (!vrm) {
        console.error('尚未加載 VRM 模型');
        return;
    }

    import('../components/loadMixamoAnimation').then(({ loadMixamoAnimation }) => {
        loadMixamoAnimation(animationUrl, vrm)
            .then((clip) => {
                console.log('FBX 動畫加載成功');

                if (!mixerRef.current) {
                    mixerRef.current = new THREE.AnimationMixer(vrm.scene);
                }

                const mixer = mixerRef.current;

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
    });
};

/**
 * 加載並應用 .vrma 動畫
 */
export const loadVRMAnimation = (animationUrl, vrm, mixerRef, loader) => {
    if (!vrm) {
        console.error('尚未加載 VRM 模型');
        return;
    }

    loader.load(
        animationUrl,
        (gltf) => {
            const vrmAnimations = gltf.userData.vrmAnimations;

            if (!vrmAnimations || vrmAnimations.length === 0) {
                console.error('未找到 VRMA 動畫數據');
                return;
            }

            const clip = createVRMAnimationClip(vrmAnimations[0], vrm);

            if (!mixerRef.current) {
                mixerRef.current = new THREE.AnimationMixer(vrm.scene);
            }

            const mixer = mixerRef.current;

            // 停止所有現有動作
            mixer.stopAllAction();

            // 播放新動畫
            const newAction = mixer.clipAction(clip);
            newAction.reset().play();

            console.log('VRMA 動畫已切換:', animationUrl);
        },
        undefined,
        (error) => {
            console.error('VRMA 動畫加載失敗:', error);
        }
    );
};



// // 限制動畫只影響脖子以下
// const headBone = vrm.humanoid.getBoneNode('head');
// const neckBone = vrm.humanoid.getBoneNode('neck');
// if (headBone) headBone.matrixAutoUpdate = false;
// if (neckBone) neckBone.matrixAutoUpdate = false;