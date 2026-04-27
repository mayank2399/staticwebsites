/**
 * Ball Dash Game Logic (Three.js)
 */

class AudioSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    playTone(freq, type, duration, vol = 0.1) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    playSwipe() {
        this.playTone(600, 'sine', 0.1, 0.05);
    }
    playJump() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }
    playHit() {
        // Explosion noise
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    playMilestone() {
        [600, 800, 1000, 1200].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.15, 0.1), i * 100));
    }
}

class BallDashGame {
    constructor() {
        this.synth = new AudioSynth();
        
        this.score = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        
        // Physics / Movement
        this.laneWidth = 3;
        this.currentLane = 0; // -1, 0, 1
        this.targetX = 0;
        
        this.baseSpeed = 0.4;
        this.currentSpeed = this.baseSpeed;
        
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -0.015;
        this.ballRadius = 0.8;
        
        // World
        this.segments = [];
        this.obstacles = [];
        this.segmentLength = 20;
        this.spawnZ = -40; // Initial spawn point ahead
        
        // UI
        this.scoreDisplay = document.getElementById('distance-display');
        this.startOverlay = document.getElementById('start-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.milestoneContainer = document.getElementById('milestone-container');
        
        // Flash
        this.flashEl = document.createElement('div');
        this.flashEl.id = 'flash';
        document.getElementById('game-ui').appendChild(this.flashEl);
        
        this.setupThreeJS();
        this.init();
    }
    
    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        this.scene.fog = new THREE.Fog(0x0a0a1a, 20, 100);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.dirLight.position.set(10, 20, 10);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.scene.add(this.dirLight);
        
        // Grid helper for floor
        const grid = new THREE.GridHelper(100, 50, 0x00ffff, 0x00ffff);
        grid.position.y = -0.01;
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);
        this.grid = grid;
        
        // Base Materials
        this.floorMat = new THREE.MeshPhongMaterial({ color: 0x111122 });
        this.ballMat = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            shininess: 100 
        });
        
        this.obsMatHigh = new THREE.MeshPhongMaterial({ 
            color: 0xff0055, 
            emissive: 0xff0055,
            emissiveIntensity: 0.3
        });
        this.obsMatLow = new THREE.MeshPhongMaterial({ 
            color: 0xff8800, 
            emissive: 0xff8800,
            emissiveIntensity: 0.3
        });
        
        // Ball setup
        this.ballGeo = new THREE.SphereGeometry(this.ballRadius, 32, 32);
        this.ball = new THREE.Mesh(this.ballGeo, this.ballMat);
        this.ball.castShadow = true;
        this.scene.add(this.ball);
    }
    
    init() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Input Handling
        this.setupTouchControls();
        this.setupKeyControls();
        
        document.getElementById('btn-start').addEventListener('click', () => {
            this.startOverlay.classList.add('hidden');
            this.startGame();
        });
        
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.gameoverOverlay.classList.add('hidden');
            this.startGame();
        });
        
        this.resetGame();
        this.animate();
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        const uiLayer = document.getElementById('game-ui');
        
        uiLayer.addEventListener('touchstart', (e) => {
            if (!this.isPlaying) return;
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });
        
        uiLayer.addEventListener('touchend', (e) => {
            if (!this.isPlaying) return;
            let touchEndX = e.changedTouches[0].screenX;
            let touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        });
    }
    
    setupKeyControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.moveLane(-1);
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.moveLane(1);
            } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                this.jump();
            }
        });
    }
    
    handleSwipe(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        const minSwipeDist = 30;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal
            if (Math.abs(dx) > minSwipeDist) {
                if (dx > 0) this.moveLane(1);
                else this.moveLane(-1);
            }
        } else {
            // Vertical
            if (Math.abs(dy) > minSwipeDist) {
                if (dy < 0) this.jump(); // Swipe Up
            }
        }
    }
    
    moveLane(dir) {
        const newLane = this.currentLane + dir;
        if (newLane >= -1 && newLane <= 1) {
            this.currentLane = newLane;
            this.targetX = this.currentLane * this.laneWidth;
            if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
            this.synth.playSwipe();
        }
    }
    
    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 0.35;
            if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
            this.synth.playJump();
        }
    }
    
    resetGame() {
        // Clear obstacles and segments
        this.obstacles.forEach(o => this.scene.remove(o.mesh));
        this.segments.forEach(s => this.scene.remove(s));
        this.obstacles = [];
        this.segments = [];
        
        // Reset state
        this.score = 0;
        this.scoreDisplay.textContent = '0m';
        this.scoreDisplay.style.opacity = '0';
        this.currentSpeed = this.baseSpeed;
        this.currentLane = 0;
        this.targetX = 0;
        this.ball.position.set(0, this.ballRadius, 0);
        this.spawnZ = -40;
        
        this.isGameOver = false;
        this.isPlaying = false;
        
        // Pre-generate floor
        for(let i=0; i<5; i++) {
            this.spawnSegment(true); // true = no obstacles
        }
        
        // Reset Camera
        this.updateCamera();
        this.grid.position.z = 0;
    }
    
    startGame() {
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.resetGame();
        this.isPlaying = true;
        this.scoreDisplay.style.opacity = '1';
    }
    
    spawnSegment(safe = false) {
        // Floor piece
        const geo = new THREE.PlaneGeometry(this.laneWidth * 3, this.segmentLength);
        const mesh = new THREE.Mesh(geo, this.floorMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.z = this.spawnZ;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.segments.push(mesh);
        
        if (!safe) {
            // Spawn obstacles
            // Max 2 obstacles per segment so there's always a way
            const lanes = [-1, 0, 1];
            // Shuffle
            lanes.sort(() => Math.random() - 0.5);
            
            const numObs = Math.floor(Math.random() * 2) + 1; // 1 or 2
            for (let i=0; i<numObs; i++) {
                const lane = lanes[i];
                
                // 30% chance for a low obstacle (jumpable)
                const isLow = Math.random() < 0.3;
                
                const w = this.laneWidth - 0.5;
                const h = isLow ? 1 : 3;
                const d = 2;
                
                const obsGeo = new THREE.BoxGeometry(w, h, d);
                const obsMesh = new THREE.Mesh(obsGeo, isLow ? this.obsMatLow : this.obsMatHigh);
                obsMesh.position.set(lane * this.laneWidth, h/2, this.spawnZ + (Math.random() * 10 - 5));
                obsMesh.castShadow = true;
                obsMesh.receiveShadow = true;
                
                this.scene.add(obsMesh);
                this.obstacles.push({
                    mesh: obsMesh,
                    isLow: isLow,
                    box: new THREE.Box3()
                });
            }
        }
        
        this.spawnZ -= this.segmentLength;
    }
    
    checkCollisions() {
        const ballBox = new THREE.Box3().setFromObject(this.ball);
        // Shrink slightly for forgiving hitbox
        ballBox.expandByScalar(-0.2); 
        
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            obs.box.setFromObject(obs.mesh);
            
            if (ballBox.intersectsBox(obs.box)) {
                this.triggerGameOver();
                break;
            }
        }
    }
    
    triggerGameOver() {
        this.isGameOver = true;
        this.isPlaying = false;
        this.synth.playHit();
        
        // Flash screen
        this.flashEl.classList.add('active');
        setTimeout(() => this.flashEl.classList.remove('active'), 100);
        
        document.getElementById('final-score').textContent = this.score + 'm';
        setTimeout(() => {
            this.gameoverOverlay.classList.remove('hidden');
        }, 1000);
    }
    
    showMilestone(text) {
        this.synth.playMilestone();
        const el = document.createElement('div');
        el.className = 'milestone-text';
        el.textContent = text;
        this.milestoneContainer.appendChild(el);
        
        setTimeout(() => {
            if(el.parentNode) el.parentNode.removeChild(el);
        }, 1500);
    }
    
    updateCamera() {
        // Smoothly follow ball Z, but fixed X and Y relative to ball
        this.camera.position.x = this.ball.position.x * 0.5; // Slight drift
        this.camera.position.y = 5;
        this.camera.position.z = this.ball.position.z + 12;
        this.camera.lookAt(0, 0, this.ball.position.z - 10);
        
        // Move light
        this.dirLight.position.z = this.ball.position.z + 10;
        this.dirLight.target.position.z = this.ball.position.z - 10;
        this.dirLight.target.updateMatrixWorld();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        if (!this.isPlaying && !this.isGameOver) return;
        
        if (this.isGameOver) {
            // Roll forward slightly then stop
        } else {
            // Forward movement
            this.ball.position.z -= this.currentSpeed;
            this.ball.rotation.x -= this.currentSpeed / this.ballRadius;
            
            // X Interpolation
            this.ball.position.x += (this.targetX - this.ball.position.x) * 0.2;
            
            // Y Jump Physics
            if (this.isJumping) {
                this.ball.position.y += this.jumpVelocity;
                this.jumpVelocity += this.gravity;
                if (this.ball.position.y <= this.ballRadius) {
                    this.ball.position.y = this.ballRadius;
                    this.isJumping = false;
                }
            }
            
            // Grid texture movement
            this.grid.position.z = (Math.abs(this.ball.position.z) % 10) * -1;
            
            this.checkCollisions();
            
            if (!this.isGameOver) {
                // Score
                const dist = Math.floor(Math.abs(this.ball.position.z));
                if (dist > this.score) {
                    this.score = dist;
                    this.scoreDisplay.textContent = this.score + 'm';
                    
                    // Speed increase
                    this.currentSpeed += 0.0001;
                    
                    if (this.score > 0 && this.score % 100 === 0) {
                        this.showMilestone(`${this.score}m!`);
                    }
                }
                
                // Track generation
                const lastSegment = this.segments[this.segments.length - 1];
                if (this.ball.position.z - 100 < lastSegment.position.z) {
                    this.spawnSegment();
                }
                
                // Cleanup old segments
                if (this.segments.length > 0 && this.segments[0].position.z > this.ball.position.z + 30) {
                    this.scene.remove(this.segments[0]);
                    this.segments.shift();
                }
                
                // Cleanup old obstacles
                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    if (this.obstacles[i].mesh.position.z > this.ball.position.z + 30) {
                        this.scene.remove(this.obstacles[i].mesh);
                        this.obstacles.splice(i, 1);
                    }
                }
            }
            
            this.updateCamera();
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.onload = () => {
    new BallDashGame();
};
