/**
 * ZigZag Runner Game Logic (Three.js)
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
    playTap() {
        // High pitched click
        this.playTone(800, 'square', 0.05, 0.05);
    }
    playMilestone() {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.15, 0.1), i * 100));
    }
    playFall() {
        // Descending slide
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }
}

class ZigZagGame {
    constructor() {
        this.synth = new AudioSynth();
        
        this.score = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        
        // Settings
        this.baseSpeed = 0.1; // Units per frame
        this.currentSpeed = this.baseSpeed;
        this.speedMultiplier = 1.0;
        this.blockSize = 2; // Width/Depth of path blocks
        
        this.direction = new THREE.Vector3(1, 0, 0); // Start moving +X
        this.lastSpawnPos = new THREE.Vector3(0, -1, 0);
        
        // Arrays
        this.pathBlocks = [];
        this.targetCameraPos = new THREE.Vector3();
        
        // UI
        this.scoreDisplay = document.getElementById('score-display');
        this.startOverlay = document.getElementById('start-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.milestoneContainer = document.getElementById('milestone-container');
        
        this.setupThreeJS();
        this.init();
    }
    
    setupThreeJS() {
        this.scene = new THREE.Scene();
        
        // Create an orthographic camera for true isometric view
        const aspect = window.innerWidth / window.innerHeight;
        const d = 15; // View size
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        
        // Position camera to look isometrically
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Soft gradient background color
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.Fog(0x0f172a, 20, 60);
        
        document.body.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(-10, 20, 10);
        dirLight.castShadow = true;
        
        // Optimize shadow map
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        
        this.scene.add(dirLight);
        this.dirLight = dirLight; // Save reference to move it with player
        
        // Geometries & Materials
        this.blockGeo = new THREE.BoxGeometry(this.blockSize, this.blockSize * 2, this.blockSize);
        
        // Slightly glowing block material
        this.blockMat = new THREE.MeshPhongMaterial({ 
            color: 0x1e293b,
            emissive: 0x000000,
            shininess: 30
        });
        
        // Alternate material for stripes
        this.altBlockMat = new THREE.MeshPhongMaterial({
            color: 0x334155,
            shininess: 30
        });
        
        this.ballGeo = new THREE.SphereGeometry(this.blockSize * 0.4, 32, 32);
        this.ballMat = new THREE.MeshPhongMaterial({ 
            color: 0x00e5ff, 
            emissive: 0x0088aa,
            emissiveIntensity: 0.5,
            shininess: 100 
        });
    }
    
    init() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Input
        const onInteract = (e) => {
            if (e.target.tagName === 'BUTTON') return;
            this.handleTap();
        };
        
        document.addEventListener('pointerdown', onInteract);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.handleTap();
        });
        
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
    
    resetGame() {
        // Clear existing
        this.pathBlocks.forEach(b => this.scene.remove(b));
        this.pathBlocks = [];
        if (this.ball) this.scene.remove(this.ball);
        
        // Reset vars
        this.score = 0;
        this.scoreDisplay.textContent = '0';
        this.scoreDisplay.style.opacity = '0';
        this.currentSpeed = this.baseSpeed;
        this.speedMultiplier = 1.0;
        this.direction.set(1, 0, 0);
        this.lastSpawnPos.set(0, -this.blockSize, 0); 
        this.lastSpawnDir = null;
        
        this.isGameOver = false;
        this.isPlaying = false;
        
        // Create initial starting platform
        this.spawnPlatform();
        
        // Pre-generate path
        for (let i = 0; i < 30; i++) {
            this.spawnNextBlock();
        }
        
        // Create Ball
        this.ball = new THREE.Mesh(this.ballGeo, this.ballMat);
        this.ball.position.set(0, this.blockSize * 0.4, 0);
        this.ball.castShadow = true;
        this.scene.add(this.ball);
        
        // Reset Camera
        this.updateCameraTarget();
        this.camera.position.copy(this.targetCameraPos);
        this.scene.background.setHex(0x0f172a);
        this.scene.fog.color.setHex(0x0f172a);
    }
    
    startGame() {
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.resetGame();
        this.isPlaying = true;
        this.scoreDisplay.style.opacity = '1';
    }
    
    spawnPlatform() {
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && z === 0) continue;
                const mesh = new THREE.Mesh(this.blockGeo, this.blockMat);
                mesh.position.set(x * this.blockSize, -this.blockSize, z * this.blockSize);
                mesh.receiveShadow = true;
                this.scene.add(mesh);
                this.pathBlocks.push(mesh);
            }
        }
        
        const center = new THREE.Mesh(this.blockGeo, this.blockMat);
        center.position.set(0, -this.blockSize, 0);
        center.receiveShadow = true;
        this.scene.add(center);
        this.pathBlocks.push(center);
    }
    
    spawnNextBlock() {
        const mat = (this.pathBlocks.length % 10 === 0) ? this.altBlockMat : this.blockMat;
        const mesh = new THREE.Mesh(this.blockGeo, mat);
        
        if (Math.random() > 0.5) {
            // Switch
            if (this.lastSpawnDir === 'x') {
                this.lastSpawnPos.z += this.blockSize;
                this.lastSpawnDir = 'z';
            } else {
                this.lastSpawnPos.x += this.blockSize;
                this.lastSpawnDir = 'x';
            }
        } else {
            // Keep going
            if (!this.lastSpawnDir) this.lastSpawnDir = 'x';
            
            if (this.lastSpawnDir === 'x') {
                this.lastSpawnPos.x += this.blockSize;
            } else {
                this.lastSpawnPos.z += this.blockSize;
            }
        }
        
        mesh.position.copy(this.lastSpawnPos);
        mesh.receiveShadow = true;
        
        // Animate block rising up
        mesh.position.y -= 10;
        
        this.scene.add(mesh);
        this.pathBlocks.push(mesh);
    }
    
    handleTap() {
        if (this.isGameOver || !this.isPlaying) return;
        
        this.synth.playTap();
        
        // Switch direction between +X and +Z
        if (this.direction.x > 0) {
            this.direction.set(0, 0, 1);
        } else {
            this.direction.set(1, 0, 0);
        }
    }
    
    checkCollision() {
        const px = this.ball.position.x;
        const pz = this.ball.position.z;
        const halfSize = this.blockSize / 2;
        
        let onPath = false;
        
        // Check only recent blocks
        for (let i = 0; i < Math.min(25, this.pathBlocks.length); i++) {
            const bx = this.pathBlocks[i].position.x;
            const bz = this.pathBlocks[i].position.z;
            
            if (px >= bx - halfSize && px <= bx + halfSize &&
                pz >= bz - halfSize && pz <= bz + halfSize) {
                onPath = true;
                break;
            }
        }
        
        if (!onPath) {
            this.triggerGameOver();
        }
    }
    
    triggerGameOver() {
        this.isGameOver = true;
        this.isPlaying = false;
        this.synth.playFall();
        
        document.getElementById('final-score').textContent = this.score;
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
    
    updateCameraTarget() {
        const offset = new THREE.Vector3(20, 20, 20);
        this.targetCameraPos.copy(this.ball.position).add(offset);
        
        this.dirLight.position.copy(this.ball.position).add(new THREE.Vector3(-10, 20, 10));
        this.dirLight.target.position.copy(this.ball.position);
        this.dirLight.target.updateMatrixWorld();
    }
    
    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 15;
        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        if (!this.isPlaying && !this.isGameOver) return;
        
        if (this.isGameOver) {
            this.ball.position.y -= 0.3;
        } else {
            // Move player
            const velocity = this.direction.clone().multiplyScalar(this.currentSpeed * this.speedMultiplier);
            this.ball.position.add(velocity);
            
            // Rotate ball
            const rotationSpeed = 0.5;
            if (this.direction.x > 0) {
                this.ball.rotation.z -= this.currentSpeed * rotationSpeed;
            } else {
                this.ball.rotation.x += this.currentSpeed * rotationSpeed;
            }
            
            this.checkCollision();
            
            if (!this.isGameOver) {
                const dist = Math.floor(this.ball.position.x + this.ball.position.z);
                if (dist > this.score) {
                    this.score = dist;
                    this.scoreDisplay.textContent = this.score;
                    
                    this.speedMultiplier += 0.0005; // Gradual increase
                    
                    if (this.score > 0 && this.score % 50 === 0) {
                        this.showMilestone(`${this.score}!`);
                        
                        const hue = (this.score / 50) * 0.15;
                        this.scene.background.setHSL(hue, 0.4, 0.1);
                        this.scene.fog.color.setHSL(hue, 0.4, 0.1);
                    }
                }
                
                const playerPos = this.ball.position;
                
                if (this.pathBlocks.length > 0) {
                    const oldest = this.pathBlocks[0];
                    if (playerPos.x - oldest.position.x > 20 || playerPos.z - oldest.position.z > 20) {
                        this.scene.remove(oldest);
                        this.pathBlocks.shift();
                        this.spawnNextBlock();
                    }
                }
                
                this.pathBlocks.forEach(b => {
                    if (b.position.y < -this.blockSize) {
                        b.position.y += 0.5;
                        if (b.position.y > -this.blockSize) {
                            b.position.y = -this.blockSize;
                        }
                    }
                });
            }
            
            this.updateCameraTarget();
        }
        
        this.camera.position.lerp(this.targetCameraPos, 0.1);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.onload = () => {
    new ZigZagGame();
};
