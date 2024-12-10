// src/utils/AnimationSystem.js
let instance = null;

export class AnimationSystem {
    constructor(loadAnimation, loadVRMAnimation) {
        if (instance) return instance; // 單例模式，確保只初始化一次
        instance = this;

        this.loadAnimation = loadAnimation;
        this.loadVRMAnimation = loadVRMAnimation;
        this.currentAnimation = null; // 當前播放的動畫名稱
        this.specialAnimationTimer = null; // 特殊待機動畫的計時器
        this.isSpecialAnimationPaused = false; // 控制特殊動畫的暫停狀態

        // 預定義動畫
        this.animations = {
            idle: [
                { action: '/animations/idle.fbx', type: 'fbx', duration: Infinity },
            ],
            talking: [
                { action: '/animations/Talking.fbx', type: 'fbx', duration: Infinity },
            ],
            start: [
                { action: 'animations/vrma/VRMA_02.vrma', type: 'vrma', duration: 7000 },
                { action: '/animations/idle.fbx', type: 'fbx', duration: Infinity },
            ],
        };

        console.log('[AnimationSystem] 初始化完成');
    }

    async playAnimation(name) {
        const animationSteps = this.animations[name];
        if (!animationSteps) {
            console.error(`[AnimationSystem] 動畫 "${name}" 未定義`);
            return;
        }

        console.log(`[AnimationSystem] 撥放動畫: ${name}`);
        this.currentAnimation = name; // 更新當前動畫狀態

        if (name === 'idle') {
            console.log('啟動特殊動畫計時器')
            this.resumeSpecialAnimations(); // 啟動特殊動畫計時器
        } else {
            console.log('暫停特殊動畫計時器')
            this.pauseSpecialAnimations(); // 暫停特殊動畫計時器
        }

        this.stopCurrentAnimation(); // 停止當前動畫

        for (const step of animationSteps) {
            try {
                console.log(`[AnimationSystem] 撥放動畫步驟: ${step.action}`);
                
                // 判斷是否是 idle 動畫步驟
                console.log(name)
                if (name === 'idle' || step.action === '/animations/idle.fbx') {
                    console.log('[AnimationSystem] 啟動特殊動畫計時器 (步驟)');
                    this.resumeSpecialAnimations();
                } else {
                    console.log('[AnimationSystem] 暫停特殊動畫計時器 (步驟)');
                    this.pauseSpecialAnimations();
                }
        
                if (step.type === 'fbx') {
                    await this.loadAnimation(step.action);
                } else if (step.type === 'vrma') {
                    await this.loadVRMAnimation(step.action);
                } else {
                    console.error(`[AnimationSystem] 未知的動畫類型: ${step.type}`);
                }
        
                if (step.duration !== Infinity) {
                    console.log(`[AnimationSystem] 等待 ${step.duration} 毫秒`);
                    await new Promise((resolve) => setTimeout(resolve, step.duration));
                } else {
                    console.log('[AnimationSystem] 動畫持續播放');
                    return; // 如果是無限持續動畫，直接返回，避免進一步處理
                }
            } catch (error) {
                console.error(`[AnimationSystem] 撥放動畫步驟時發生錯誤: ${error}`);
            }
        }
        

        console.log(`[AnimationSystem] 動畫 "${name}" 撥放結束`);

        // 動畫結束後切回 `idle`
        if (name !== 'idle') {
            console.log('[AnimationSystem] 自動切換回 idle 動畫');
            this.playAnimation('idle');
        }
    }

    stopCurrentAnimation() {
        console.log('[AnimationSystem] 停止當前動畫');
        this.currentAnimation = null;
    }

    playIdleWithSpecialAnimations() {
        this.stopSpecialAnimations(); // 停止可能已有的特殊動畫
        this.isSpecialAnimationPaused = false;
        console.log('[AnimationSystem] 啟動特殊待機動畫循環');

        const specialAnimations = [
            { action: 'animations/vrma/VRMA_01.vrma', type: 'vrma', duration: 5500 },
            { action: 'animations/vrma/VRMA_03.vrma', type: 'vrma', duration: 8000 },
            { action: 'animations/vrma/VRMA_04.vrma', type: 'vrma', duration: 7000 },
            { action: 'animations/vrma/VRMA_06.vrma', type: 'vrma', duration: 5000 },
            { action: 'animations/vrma/VRMA_06.vrma', type: 'vrma', duration: 7200 },
        ];

        const scheduleNextSpecialAnimation = async () => {
            if (this.isSpecialAnimationPaused) {
                console.log('[AnimationSystem] 特殊待機動畫已暫停或當前動畫不是 idle');
                return;
            }

            const randomDelay = Math.random() * (20000 - 10000) + 10000; // 隨機間隔 10 到 20 秒
            console.log(`[AnimationSystem] 設置計時器等待 ${randomDelay} 毫秒`);

            this.specialAnimationTimer = setTimeout(async () => {
                if (this.isSpecialAnimationPaused) {
                    console.log('[AnimationSystem] 停止特殊待機動畫計時器');
                    return;
                }

                // 隨機選擇一個特別待機動畫
                const randomAnimation =
                    specialAnimations[
                        Math.floor(Math.random() * specialAnimations.length)
                    ];
                console.log(`[AnimationSystem] 撥放特別待機動畫: ${randomAnimation.action}`);

                // 撥放特別待機動畫
                await this.loadVRMAnimation(randomAnimation.action);

                // 等待動畫完成
                console.log(`[AnimationSystem] 等待特別動畫播放完成 (${randomAnimation.duration} ms)`);
                await new Promise((resolve) =>
                    setTimeout(resolve, randomAnimation.duration)
                );

                if (this.isSpecialAnimationPaused) return;

                // 撥放主要待機動畫
                console.log('[AnimationSystem] 撥放主要待機動畫: /animations/idle.fbx');
                await this.loadAnimation('/animations/idle.fbx');

                scheduleNextSpecialAnimation(); // 安排下一次特殊動畫
            }, randomDelay);
        };

        scheduleNextSpecialAnimation(); // 啟動循環
    }

    stopSpecialAnimations() {
        console.log('[AnimationSystem] 停止特殊待機動畫');
        this.isSpecialAnimationPaused = true;

        if (this.specialAnimationTimer) {
            clearTimeout(this.specialAnimationTimer);
            this.specialAnimationTimer = null;
        }
    }

    pauseSpecialAnimations() {
        console.log('[AnimationSystem] 暫停特殊待機動畫');
        this.isSpecialAnimationPaused = true;
        this.stopSpecialAnimations();
    }

    resumeSpecialAnimations() {
        console.log('[AnimationSystem] 恢復特殊待機動畫');
        console.log('[AnimationSystem] Current Animaton: ', this.currentAnimation);
        // if (this.currentAnimation === 'idle') {
            this.isSpecialAnimationPaused = false;
            this.playIdleWithSpecialAnimations();
        // }
    }

    playStartWithIdleAndSpecialAnimations() {
        console.log('[AnimationSystem] 撥放起始動畫並進入特殊待機循環');
        this.playAnimation('start');
    }
}
