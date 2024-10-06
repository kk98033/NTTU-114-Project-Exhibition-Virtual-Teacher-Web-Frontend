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
import ExpressionControls from './ExpressionControls'; // 引入 ExpressionControls 組件

// 引入背景圖片
import backgroundImage from '../assets/images/background.jpg';

const VRMViewer = () => {
    const mountRef = useRef(null);
    const fileInputRef = useRef(null); // 引用文件輸入（如果需要更換背景）
    const [currentVrm, setCurrentVrm] = useState(null);
    const [currentMixer, setCurrentMixer] = useState(null);
    const [bgImage, setBgImage] = useState(backgroundImage); // 添加背景圖片狀態
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const composerRef = useRef(null);
    const controlsRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 初始化 Three.js
    useEffect(() => {
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
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
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

        // 添加燈光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1.0, 1.0, 1.0).normalize();
        scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // 啟動畫面渲染
        const animate = () => {
            requestAnimationFrame(animate);
            const deltaTime = clockRef.current.getDelta();
            if (currentMixer) {
                currentMixer.update(deltaTime);
            }
            if (currentVrm) {
                currentVrm.update(deltaTime);
            }
            composer.render();
        };

        animate();

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
            if (currentVrm) {
                scene.remove(currentVrm.scene);
                VRMUtils.deepDispose(currentVrm.scene);
            }
        };
    }, []); // 空依賴陣列，僅在組件掛載時運行一次

    // 加載 VRM 模型
    useEffect(() => {
        if (!mountRef.current) return;

        const scene = sceneRef.current;

        // 自動載入 teacher.vrm
        const defaultModelUrl = '/models/teacher.vrm'; // 放在 public/models/teacher.vrm
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        setLoading(true);
        setError(null);

        loader.load(
            defaultModelUrl,
            (gltf) => {
                const vrm = gltf.userData.vrm;
                if (currentVrm) {
                    scene.remove(currentVrm.scene);
                    VRMUtils.deepDispose(currentVrm.scene);
                }
                VRMUtils.removeUnnecessaryJoints(vrm.scene);
                setCurrentVrm(vrm);
                scene.add(vrm.scene);
                vrm.scene.traverse((obj) => {
                    obj.frustumCulled = false;
                });
                VRMUtils.rotateVRM0(vrm);
                console.log(vrm);

                // 控制 blendshape 動畫
                controlBlendShapes(vrm);

                setLoading(false);
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
            if (currentVrm) {
                scene.remove(currentVrm.scene);
                VRMUtils.deepDispose(currentVrm.scene);
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

            <div
                ref={mountRef}
                style={{ width: '100%', height: '100vh' }}
            >
                {/* 渲染區域，不顯示任何文字 */}
            </div>
            {currentVrm && <ExpressionControls vrm={currentVrm} />} {/* 添加表情控制器 */}
        </div>
    );
};

export default VRMViewer;
