// src/components/loadMixamoAnimation.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { mixamoVRMRigMap } from './mixamoVRMRigMap';

export function loadMixamoAnimation(url, vrm) {
    const loader = new FBXLoader();
    return loader.loadAsync(url).then((asset) => {
        // 找到名稱為 'mixamo.com' 的動畫剪輯
        const clip = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com') || asset.animations[0];
        if (!clip) {
            throw new Error('在 FBX 文件中未找到動畫剪輯。');
        }

        const tracks = [];
        const restRotationInverse = new THREE.Quaternion();
        const parentRestWorldRotation = new THREE.Quaternion();
        const _quatA = new THREE.Quaternion();
        const _vec3 = new THREE.Vector3();

        const motionHips = asset.getObjectByName('mixamorigHips');
        if (!motionHips) {
            throw new Error('在 FBX 動畫中未找到 mixamorigHips 骨骼。');
        }
        const motionHipsHeight = motionHips.position.y;

        const vrmHips = vrm.humanoid?.getNormalizedBoneNode('hips');
        if (!vrmHips) {
            throw new Error('在 VRM 模型中未找到 hips 骨骼。');
        }
        const vrmHipsY = vrmHips.getWorldPosition(_vec3).y;
        const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
        const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
        const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

        clip.tracks.forEach((track) => {
            const trackSplitted = track.name.split('.');
            const mixamoRigName = trackSplitted[0];
            const propertyName = trackSplitted[1];
            const mixamoRigNode = asset.getObjectByName(mixamoRigName);
            const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
            const vrmBoneNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName);
            const vrmNodeName = vrmBoneNode?.name;

            if (vrmNodeName && mixamoRigNode) {
                // **在這裡添加檢查，忽略 hips 的 position 動畫**
                if (vrmBoneName === 'hips' && propertyName === 'position') {
                    // 忽略 hips 的位置動畫
                    return;
                }

                mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
                mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

                if (track instanceof THREE.QuaternionKeyframeTrack) {
                    for (let i = 0; i < track.values.length; i += 4) {
                        const flatQuaternion = track.values.slice(i, i + 4);
                        _quatA.fromArray(flatQuaternion);
                        _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
                        _quatA.toArray(flatQuaternion);
                        flatQuaternion.forEach((v, index) => {
                            track.values[index + i] = v;
                        });
                    }
                    tracks.push(
                        new THREE.QuaternionKeyframeTrack(
                            `${vrmNodeName}.${propertyName}`,
                            track.times,
                            track.values.map((v, i) => (vrm.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v)),
                        ),
                    );
                } else if (track instanceof THREE.VectorKeyframeTrack) {
                    const value = track.values.map(
                        (v, i) => (vrm.meta?.metaVersion === '0' && i % 3 !== 1 ? -v : v) * hipsPositionScale
                    );
                    tracks.push(
                        new THREE.VectorKeyframeTrack(
                            `${vrmNodeName}.${propertyName}`,
                            track.times,
                            value
                        )
                    );
                }
            }
        });
        return new THREE.AnimationClip('vrmAnimation', clip.duration, tracks);
    });
}
