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

const VRMViewer = () => {
    const mountRef = useRef(null);
    const [currentVrm, setCurrentVrm] = useState(null);
    const [currentMixer, setCurrentMixer] = useState(null);
    const sceneRef = useRef(new THREE.Scene()); // 使用 useRef 定義 scene
    const composerRef = useRef(null);

    useEffect(() => {
        const scene = sceneRef.current; // 確保 scene 在 useEffect 中引用正確
        const camera = new THREE.PerspectiveCamera(30.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
        camera.position.set(0.0, 1.0, 5.0);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        composerRef.current = new EffectComposer(renderer);
        composerRef.current.addPass(new RenderPass(scene, camera));
        const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
        composerRef.current.addPass(gammaCorrectionPass);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.screenSpacePanning = true;
        controls.target.set(0.0, 1.0, 0.0);
        controls.update();

        const light = new THREE.DirectionalLight(0xffffff, 0.5); // 將強度設置為 0.5
        light.position.set(1.0, 1.0, 1.0).normalize();
        scene.add(light);

        // 添加環境光來柔化效果
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 環境光強度設置為 0.5
        scene.add(ambientLight);

        const defaultModelUrl = 'path/to/your/model.vrm';
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser)); // 不傳遞 helperRoot 參數

        loader.load(defaultModelUrl, (gltf) => {
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

            // 開始控制 blendshape 動畫
            controlBlendShapes(vrm);
        });

        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const deltaTime = clock.getDelta();
            if (currentMixer) {
                currentMixer.update(deltaTime);
            }
            if (currentVrm) {
                currentVrm.update(deltaTime);
            }
            composerRef.current.render(); // 使用 composer 渲染
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, [currentVrm, currentMixer]);

    const handleDrop = (event) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (!files) return;
        const file = files[0];
        if (!file) return;
        const fileType = file.name.split('.').pop();
        const blob = new Blob([file], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        if (fileType === 'fbx') {
            loadFBX(url);
        } else {
            loadVRM(url);
        }
    };

    const loadVRM = (modelUrl) => {
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        loader.load(modelUrl, (gltf) => {
            const vrm = gltf.userData.vrm;
            if (currentVrm) {
                sceneRef.current.remove(currentVrm.scene); // 使用 sceneRef.current
                VRMUtils.deepDispose(currentVrm.scene);
            }
            setCurrentVrm(vrm);
            sceneRef.current.add(vrm.scene); // 使用 sceneRef.current
            vrm.scene.traverse((obj) => {
                obj.frustumCulled = false;
            });
            VRMUtils.rotateVRM0(vrm);
            console.log(vrm);

            // 開始控制 blendshape 動畫
            controlBlendShapes(vrm);
        });
    };

    const loadFBX = (animationUrl) => {
        if (!currentVrm) return;
        const mixer = new THREE.AnimationMixer(currentVrm.scene);
        loadMixamoAnimation(animationUrl, currentVrm).then((clip) => {
            mixer.clipAction(clip).play();
            setCurrentMixer(mixer);
        });
    };

    return (
        <div>
            <div ref={mountRef} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                Drag and drop a VRM or FBX file here
            </div>
            {currentVrm && <ExpressionControls vrm={currentVrm} />} {/* 添加表情控制器 */}
        </div>
    );
};

export default VRMViewer;
