// src/components/VRMViewer.js
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from './loadMixamoAnimation';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { controlBlendShapes } from './controlBlendShapes';
import ExpressionControls from './ExpressionControls'; 

// 引入背景圖片
import backgroundImage from '../assets/images/background.jpg';
import { syncMouthAnimation } from '../utils/syncMouthAnimation';
import { useVRM } from '../context/VRMContext';
import { applyFBXAnimation } from '../utils/animationUtils';
import { VRMAnimationLoaderPlugin, VRMLookAtQuaternionProxy } from '@pixiv/three-vrm-animation';
import { AnimationSystem } from '../utils/AnimationSystem';

// export const playProcessedAudioWithMouthAnimation = (audioUrl) => {
//     if (!currentVrmRef.current) {
//         console.error('VRM 模型未加載');
//         return;
//     }

//     syncMouthAnimation(audioUrl, currentVrmRef.current);
// };

const VRMViewer = () => {
    const { currentVrmRef, mixerRef, loadAnimation, loadVRMAnimation } = useVRM(); // 從 Context 獲取共享數據
    const mountRef = useRef(null);
    const fileInputRef = useRef(null);
    // const currentVrmRef = useRef(null); // 使用 useRef 管理當前的 VRM 模型
    const modelContainerRef = useRef(null); // 新增父級容器的引用
    // const mixerRef = useRef(null);
    const [bgImage, setBgImage] = useState(backgroundImage);
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const composerRef = useRef(null);
    const controlsRef = useRef(null);
    const lookAtTarget = useRef(new THREE.Object3D()); 
    const clockRef = useRef(new THREE.Clock());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const modelLoadedRef = useRef(false); // 防止模型重複加載

    const animationSystem = new AnimationSystem(loadAnimation, loadVRMAnimation);

    // 初始化 Three.js
    useEffect(() => {
        console.log('初始化 Three.js 的 useEffect 被調用');
        const scene = sceneRef.current;

        // 加載背景圖片並設置為背景
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            bgImage,
            (texture) => {
                scene.background = texture;
            },
            undefined,
            (error) => {
                console.error('背景圖片加載失敗:', error);
                scene.background = new THREE.Color(0xdddddd);
                setError('背景圖片加載失敗');
            }
        );

        // 設置相機
        const camera = new THREE.PerspectiveCamera(
            30.0,
            window.innerWidth / window.innerHeight,
            0.1,
            20.0
        );
        camera.position.set(0.0, 1.0, 5.0);
        cameraRef.current = camera;

        // 設置渲染器
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance', // 優化性能
        });
        if (!renderer.capabilities.isWebGL2) {
            console.warn('當前瀏覽器不支持 WebGL 2，渲染效果可能會受限');
        }        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;
        mountRef.current.appendChild(renderer.domElement);

        // 設置後處理
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
        composer.addPass(gammaCorrectionPass);
        composerRef.current = composer;

        // 設置控制器
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.screenSpacePanning = true;
        controls.target.set(0.0, 1.0, 0.0);
        controls.update();
        controlsRef.current = controls;

        // 新增 LookAt 目標
        lookAtTarget.current.position.set(0, 1, 0); // 設置目標位置在螢幕正中央
        camera.add(lookAtTarget.current);

        // 添加燈光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1.0, 1.0, 1.0).normalize();
        scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // 創建模型的父級容器
        const modelContainer = new THREE.Group();
        scene.add(modelContainer);
        modelContainerRef.current = modelContainer;

        // 啟動畫面渲染
        const animate = () => {
            requestAnimationFrame(animate);
            const deltaTime = clockRef.current.getDelta();
            if (mixerRef.current) {
                mixerRef.current.update(deltaTime);
            }
            if (currentVrmRef.current) {
                currentVrmRef.current.update(deltaTime);
            }
            composer.render();
        };

        animate();

        // 監聽滑鼠移動事件
        const handleMouseMove = (event) => {
            // 動態更新 LookAt 目標位置
            lookAtTarget.current.position.x =
                10.0 * ((event.clientX - 0.5 * window.innerWidth) / window.innerHeight);
            lookAtTarget.current.position.y =
                -10.0 * ((event.clientY - 0.5 * window.innerHeight) / window.innerHeight);
        };
        window.addEventListener('mousemove', handleMouseMove);

        // 處理窗口大小調整
        const handleResize = () => {
            if (cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = window.innerWidth / window.innerHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(window.innerWidth, window.innerHeight);
                composerRef.current.setSize(window.innerWidth, window.innerHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        // 清理資源
        return () => {
            window.removeEventListener('resize', handleResize);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
            if (composerRef.current) {
                composerRef.current.dispose();
            }
            if (controlsRef.current) {
                controlsRef.current.dispose();
            }
            if (currentVrmRef.current) {
                modelContainerRef.current.remove(currentVrmRef.current.scene);
                VRMUtils.deepDispose(currentVrmRef.current.scene);
                currentVrmRef.current = null;
            }
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current.uncacheRoot(currentVrmRef.current?.scene);
                mixerRef.current = null;
            }
        };
    }, []); // 空依賴陣列，僅在組件掛載時運行一次

    // 加載 VRM 模型
    useEffect(() => {
        console.log('加載 VRM 模型的 useEffect 被調用');
        if (modelLoadedRef.current) {
            console.log('模型已加載，跳過重複加載');
            return;
        }
        modelLoadedRef.current = true;

        if (!mountRef.current) return;

        const scene = sceneRef.current;

        // 自動載入 teacher.vrm
        const defaultModelUrl = '/models/teacher.vrm'; // 放在 public/models/teacher.vrm
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

        setLoading(true);
        setError(null);

        loader.load(
            defaultModelUrl,
            (gltf) => {
                const vrm = gltf.userData.vrm;
                if (currentVrmRef.current) {
                    modelContainerRef.current.remove(currentVrmRef.current.scene);
                    VRMUtils.deepDispose(currentVrmRef.current.scene);
                }
                VRMUtils.removeUnnecessaryJoints(vrm.scene);
                currentVrmRef.current = vrm; // 更新 currentVrmRef

                // 手動創建 VRMLookAtQuaternionProxy
                if (!vrm.lookAt.quaternionProxy) {
                    const lookAtQuatProxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
                    vrm.lookAt.quaternionProxy = lookAtQuatProxy;
                    vrm.scene.add(lookAtQuatProxy);
                }

                // 設置 LookAt 目標
                if (!vrm.lookAt.quaternionProxy) {
                    const lookAtQuatProxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
                    vrm.lookAt.quaternionProxy = lookAtQuatProxy;
                    vrm.scene.add(lookAtQuatProxy);
                }
                vrm.lookAt.target = lookAtTarget.current;

                // 將頭部的 LookAt 功能啟用
                const headBone = vrm.humanoid.getBoneNode('head');
                if (headBone) {
                    headBone.lookAt(lookAtTarget.current.position);
                }

                // 將模型添加到父級容器
                modelContainerRef.current.add(vrm.scene);

                vrm.scene.traverse((obj) => {
                    obj.frustumCulled = false;
                });
                VRMUtils.rotateVRM0(vrm);

                // 調整父級容器的位置和縮放
                modelContainerRef.current.position.set(0, -1.5, 0); // 將模型稍微向下移動
                modelContainerRef.current.scale.set(2, 2, 2); // 將模型放大 2 倍

                console.log('VRM 模型加載成功:', vrm);

                // 控制 blendshape 動畫
                controlBlendShapes(vrm);

                // 列出骨骼名稱
                Object.keys(vrm.humanoid.humanBones).forEach((bone) => {
                    const node = vrm.humanoid.getNormalizedBoneNode(bone);
                    if (node) {
                        console.log(`VRM 骨骼: ${bone} - 節點名稱: ${node.name}`);
                    }
                });

                setLoading(false);

                // 加載完成後套用動畫
                // loadAnimation('/animations/idle.fbx');
                // loadVRMAnimation('animations/vrma/VRMA_02.vrma');

                // 開始播放起始動畫，接續待機動畫與特別動畫
                animationSystem.playStartWithIdleAndSpecialAnimations();

                // 自動加載默認動畫
                // loadAnimation('/animations/Talking.fbx');
            },
            undefined,
            (error) => {
                console.error('VRM 模型加載失敗:', error);
                setError('VRM 模型加載失敗');
                setLoading(false);
            }
        );

        // 清理資源（如果需要）
        return () => {
            if (currentVrmRef.current) {
                modelContainerRef.current.remove(currentVrmRef.current.scene);
                VRMUtils.deepDispose(currentVrmRef.current.scene);
                currentVrmRef.current = null;
            }
        };
    }, []); // 空依賴陣列，僅在組件掛載時運行一次

    // 處理背景圖片變更
    useEffect(() => {
        const scene = sceneRef.current;

        if (!bgImage) return;

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            bgImage,
            (texture) => {
                scene.background = texture;
            },
            undefined,
            (error) => {
                console.error('背景圖片加載失敗:', error);
                scene.background = new THREE.Color(0xdddddd);
                setError('背景圖片加載失敗');
            }
        );

        // 釋放之前的 URL（如果是 blob URL）
        return () => {
            if (bgImage && typeof bgImage === 'string' && bgImage.startsWith('blob:')) {
                URL.revokeObjectURL(bgImage);
            }
        };
    }, [bgImage]);

    // 處理背景圖片更換
    const handleBgChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBgImage(url);
        }
    };

    // 套用 FBX 動畫
    // const loadAnimation = (animationUrl) => {
    //     if (currentVrmRef.current) {
    //         applyFBXAnimation(animationUrl, currentVrmRef.current, mixerRef);
    //     } else {
    //         console.error('VRM 模型未加載，無法套用動畫');
    //     }
    // };

    // const applyFBXAnimation = () => {
    //     const animationUrl = '/animations/Talking.fbx'; // 確保路徑正確
    //     // const animationUrl = '/animations/animation.fbx'; // 確保路徑正確
    //     if (!currentVrmRef.current) {
    //         console.error('尚未加載 VRM 模型');
    //         return;
    //     }

    //     loadMixamoAnimation(animationUrl, currentVrmRef.current)
    //         .then((clip) => {
    //             console.log('FBX 動畫加載成功');
    //             if (mixerRef.current) {
    //                 mixerRef.current.stopAllAction(); // 停止所有動作
    //             } else {
    //                 mixerRef.current = new THREE.AnimationMixer(currentVrmRef.current.scene);
    //             }
    //             const action = mixerRef.current.clipAction(clip);
    //             action.play();
    //         })
    //         .catch((error) => {
    //             console.error('FBX 動畫加載失敗:', error);
    //             setError('FBX 動畫加載失敗');
    //         });
    // };

    return (
        <div>
            {/* 自定義按鈕來更換背景圖片（如果需要） */}
            <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 1,
                    padding: '10px 20px',
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                更換背景
            </button>
            <input
                type="file"
                accept="image/*"
                onChange={handleBgChange}
                style={{ display: 'none' }} // 隱藏文件輸入
                ref={fileInputRef}
            />

            {/* 顯示加載指示器 */}
            {loading && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#fff',
                        zIndex: 2,
                    }}
                >
                    加載中...
                </div>
            )}

            {/* 顯示錯誤消息 */}
            {error && (
                <div
                    style={{
                        position: 'absolute',
                        top: '60%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'red',
                        zIndex: 2,
                    }}
                >
                    {error}
                </div>
            )}

            <div ref={mountRef} style={{ width: '100%', height: '100vh' }}>
                {/* 渲染區域，不顯示任何文字 */}
            </div>
            {currentVrmRef.current && <ExpressionControls vrm={currentVrmRef.current} />} {/* 添加表情控制器 */}
        </div>
    );
};

export default VRMViewer;
