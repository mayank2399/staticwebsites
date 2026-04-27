/**
 * Stack Smash Game Logic (Three.js)
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
    playBounce() {
        this.playTone(400, 'sine', 0.1, 0.05);
    }
    playSmash() {
        // Deep noise
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    playObstacle() {
        this.playTone(150, 'sawtooth', 0.3, 0.2);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.5, 0.2), 100);
    }
    playLevelUp() {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.15, 0.1), i * 100));
    }
}

class StackSmash {
    constructor() {
        this.synth = new AudioSynth();
        this.score = 0;
        this.level = 1;
        this.totalLayers = 0;
        this.layersSmashed = 0;
        
        this.isSmashing = false;
        this.isGameOver = false;
        this.isLevelComplete = false;
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222233);
        // Add some fog for depth
        this.scene.fog = new THREE.Fog(0x222233, 10, 50);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 12);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        this.setupLighting();
        
        // Physics constants
        this.gravity = -0.015;
        this.bounceSpeed = 0.25;
        this.ballYVelocity = 0;
        this.ballBaseY = 3.5;
        this.towerRotationSpeed = 0.02;
        
        // Groups
        this.towerGroup = new THREE.Group();
        this.scene.add(this.towerGroup);
        
        this.layers = [];
        this.fragments = []; // For shatter animation
        
        // UI
        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level-display');
        this.progressBar = document.getElementById('progress-bar');
        this.modal = document.getElementById('modal-overlay');
        
        this.init();
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);
    }
    
    init() {
        this.createBall();
        this.buildLevel();
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Inputs
        document.addEventListener('pointerdown', this.onPointerDown.bind(this));
        document.addEventListener('pointerup', this.onPointerUp.bind(this));
        document.addEventListener('pointercancel', this.onPointerUp.bind(this));
        
        document.getElementById('btn-action').addEventListener('click', () => {
            this.modal.classList.add('hidden');
            if (this.isLevelComplete) {
                this.level++;
            } else {
                this.score = 0;
            }
            this.buildLevel();
        });
        
        this.animate();
    }
    
    createBall() {
        if (this.ball) this.scene.remove(this.ball);
        
        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0xff3366, shininess: 100 });
        this.ball = new THREE.Mesh(geometry, material);
        this.ball.castShadow = true;
        // Position ball slightly to the front so it sits on the front part of the layer
        this.ball.position.set(0, this.ballBaseY, 3.5); 
        this.scene.add(this.ball);
    }
    
    buildLevel() {
        // Clear old tower
        while(this.towerGroup.children.length > 0) { 
            this.towerGroup.remove(this.towerGroup.children[0]); 
        }
        this.layers = [];
        this.fragments = [];
        this.towerGroup.position.y = 0;
        this.towerGroup.rotation.y = 0;
        
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.isSmashing = false;
        this.ballYVelocity = this.bounceSpeed;
        this.ball.position.y = this.ballBaseY;
        
        this.layersSmashed = 0;
        this.totalLayers = 15 + (this.level * 5); // Increase layers per level
        
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = `LEVEL ${this.level}`;
        this.progressBar.style.width = '0%';
        
        // Colors
        const baseColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
        const obstacleColor = new THREE.Color(0x111111); // Blackish
        
        // Central cylinder
        const cylGeom = new THREE.CylinderGeometry(1, 1, this.totalLayers * 2, 32);
        const cylMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
        const cylinder = new THREE.Mesh(cylGeom, cylMat);
        cylinder.position.y = - (this.totalLayers * 2) / 2 + 2; // Move down
        cylinder.receiveShadow = true;
        this.towerGroup.add(cylinder);
        
        // Create layers
        const slicesCount = 12;
        const radius = 4;
        const innerRadius = 1;
        const layerHeight = 0.5;
        const ySpacing = 1.5;
        
        // Shape for a slice
        const shape = new THREE.Shape();
        shape.moveTo(innerRadius, 0);
        shape.lineTo(radius, 0);
        const angle = (Math.PI * 2) / slicesCount;
        shape.absarc(0, 0, radius, 0, angle, false);
        shape.lineTo(innerRadius * Math.cos(angle), innerRadius * Math.sin(angle));
        shape.absarc(0, 0, innerRadius, angle, 0, true);
        
        const extrudeSettings = {
            depth: layerHeight,
            bevelEnabled: true,
            bevelSegments: 1,
            steps: 1,
            bevelSize: 0.05,
            bevelThickness: 0.05
        };
        const sliceGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Center the geometry slightly to make rotation around Y proper
        sliceGeom.translate(0, 0, -layerHeight/2);
        sliceGeom.rotateX(Math.PI / 2); // Lay flat
        
        const normalMat = new THREE.MeshPhongMaterial({ color: baseColor });
        const obsMat = new THREE.MeshPhongMaterial({ color: obstacleColor });
        const finishMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc });
        
        for (let i = 0; i < this.totalLayers; i++) {
            const isFinish = (i === this.totalLayers - 1);
            
            // Randomly assign obstacles
            // Don't put obstacles on the first layer, and adjust difficulty
            const numObstacles = (i === 0 || isFinish) ? 0 : Math.min(6, 1 + Math.floor(Math.random() * (this.level/2)));
            // Gap so ball can fall through
            const gapStart = Math.floor(Math.random() * slicesCount);
            const gapSize = isFinish ? 0 : 2;
            
            const layerGroup = new THREE.Group();
            layerGroup.position.y = 2 - (i * ySpacing);
            
            const slices = [];
            
            for (let j = 0; j < slicesCount; j++) {
                // Gap
                if (!isFinish && j >= gapStart && j < gapStart + gapSize) continue;
                if (!isFinish && gapStart + gapSize > slicesCount && j < (gapStart + gapSize) % slicesCount) continue;
                
                let isObstacle = false;
                if (!isFinish && numObstacles > 0 && Math.random() < (numObstacles / slicesCount)) {
                    isObstacle = true;
                }
                
                const mesh = new THREE.Mesh(sliceGeom, isFinish ? finishMat : (isObstacle ? obsMat : normalMat));
                mesh.rotation.y = j * angle;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData = { isObstacle, isFinish, angleStart: j * angle, angleEnd: (j+1) * angle };
                
                layerGroup.add(mesh);
                slices.push(mesh);
            }
            
            // Rotate layer randomly so gaps don't always align perfectly
            layerGroup.rotation.y = Math.random() * Math.PI * 2;
            
            this.towerGroup.add(layerGroup);
            this.layers.push({ group: layerGroup, slices: slices, isFinish });
        }
    }
    
    onPointerDown(e) {
        if (e.target.tagName === 'BUTTON') return;
        if (this.isGameOver || this.isLevelComplete) return;
        
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.isSmashing = true;
    }
    
    onPointerUp() {
        this.isSmashing = false;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    shatterLayer(layer) {
        this.synth.playSmash();
        this.score += 10;
        this.scoreDisplay.textContent = this.score;
        
        // Create fragments flying out
        layer.slices.forEach(slice => {
            // Detach from layerGroup, add to scene
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            slice.getWorldPosition(worldPos);
            slice.getWorldQuaternion(worldQuat);
            
            slice.position.copy(worldPos);
            slice.quaternion.copy(worldQuat);
            
            this.scene.add(slice);
            
            // Calculate outward velocity based on rotation
            const angle = Math.atan2(slice.position.x, slice.position.z);
            const speed = 0.2 + Math.random() * 0.2;
            
            this.fragments.push({
                mesh: slice,
                vx: Math.sin(angle) * speed,
                vy: Math.random() * 0.2,
                vz: Math.cos(angle) * speed,
                rx: Math.random() * 0.1,
                ry: Math.random() * 0.1,
                rz: Math.random() * 0.1,
                life: 1.0
            });
        });
        
        // Remove layer group from tower
        this.towerGroup.remove(layer.group);
        
        this.layersSmashed++;
        const prog = (this.layersSmashed / this.totalLayers) * 100;
        this.progressBar.style.width = `${prog}%`;
    }
    
    triggerGameOver() {
        this.isGameOver = true;
        this.isSmashing = false;
        this.synth.playObstacle();
        
        // Bounce off obstacle
        this.ballYVelocity = 0.3;
        
        setTimeout(() => {
            document.getElementById('modal-title').textContent = "GAME OVER";
            document.getElementById('modal-title').style.color = "#ff3366";
            document.getElementById('final-score').textContent = this.score;
            document.getElementById('btn-action').textContent = "TRY AGAIN";
            this.modal.classList.remove('hidden');
        }, 1000);
    }
    
    triggerLevelComplete() {
        this.isLevelComplete = true;
        this.isSmashing = false;
        this.synth.playLevelUp();
        
        setTimeout(() => {
            document.getElementById('modal-title').textContent = "LEVEL COMPLETE!";
            document.getElementById('modal-title').style.color = "#00ffcc";
            document.getElementById('final-score').textContent = this.score;
            document.getElementById('btn-action').textContent = "NEXT LEVEL";
            this.modal.classList.remove('hidden');
        }, 1000);
    }
    
    updatePhysics() {
        if (this.isGameOver || this.isLevelComplete) {
            // Just let the ball fall/bounce freely
            this.ball.position.y += this.ballYVelocity;
            this.ballYVelocity += this.gravity;
            if (this.ball.position.y < -10) this.ball.position.y = -10;
        } else {
            // Normal gameplay
            this.towerGroup.rotation.y += this.towerRotationSpeed;
            
            // Ball physics
            if (this.isSmashing) {
                this.ballYVelocity = -0.3; // Fall fast
            } else {
                this.ballYVelocity += this.gravity;
            }
            
            this.ball.position.y += this.ballYVelocity;
            
            // Check collision with the current top layer
            if (this.layers.length > 0) {
                const topLayer = this.layers[0];
                const layerWorldY = topLayer.group.position.y + this.towerGroup.position.y;
                
                // If ball hits the layer
                if (this.ball.position.y - 0.4 <= layerWorldY + 0.25) {
                    
                    // We need to check if the ball is over an obstacle or empty space
                    // Ball is at (0, y, 3.5). Calculate angle relative to tower rotation
                    // Standard atan2(x, z) gives 0 when straight forward on Z.
                    // Because tower rotates, the relative angle changes.
                    let relativeAngle = -this.towerGroup.rotation.y - topLayer.group.rotation.y;
                    // Normalize angle to 0 - 2PI
                    relativeAngle = relativeAngle % (Math.PI * 2);
                    if (relativeAngle < 0) relativeAngle += Math.PI * 2;
                    
                    // The ball is at Z=3.5, X=0. Angle is 0 in standard unrotated space.
                    // We check which slice encompasses `relativeAngle`.
                    
                    let hitSlice = null;
                    for (let slice of topLayer.slices) {
                        let start = slice.userData.angleStart;
                        let end = slice.userData.angleEnd;
                        // Handle wrap around
                        if (start <= relativeAngle && relativeAngle < end) {
                            hitSlice = slice; break;
                        }
                    }
                    
                    if (this.isSmashing) {
                        if (hitSlice) {
                            if (hitSlice.userData.isObstacle) {
                                // Hit obstacle!
                                this.triggerGameOver();
                            } else if (hitSlice.userData.isFinish) {
                                // Hit finish!
                                this.shatterLayer(topLayer);
                                this.layers.shift();
                                this.triggerLevelComplete();
                            } else {
                                // Smash normal!
                                this.shatterLayer(topLayer);
                                this.layers.shift();
                                // Move tower up immediately for continuous smashing effect
                                this.towerGroup.position.y += 1.5;
                            }
                        } else {
                            // Hit gap while smashing - pass through
                            // Ball naturally falls. Tower moves up smoothly to follow camera
                        }
                    } else {
                        // Bouncing state
                        if (hitSlice) {
                            // Bounce off
                            this.ball.position.y = layerWorldY + 0.65;
                            this.ballYVelocity = this.bounceSpeed;
                            this.synth.playBounce();
                        } else {
                            // Fall through gap
                        }
                    }
                }
            }
            
            // Camera follow logic
            // We want the ball to stay generally around ballBaseY in the camera's view.
            // If the ball falls, we move the tower up to compensate, bringing the next layer to the ball.
            if (this.ball.position.y < this.ballBaseY - 1) {
                const diff = (this.ballBaseY - 1) - this.ball.position.y;
                this.towerGroup.position.y += diff;
                this.ball.position.y += diff;
            }
        }
        
        // Update fragments
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const f = this.fragments[i];
            f.mesh.position.x += f.vx;
            f.mesh.position.y += f.vy;
            f.mesh.position.z += f.vz;
            f.mesh.rotation.x += f.rx;
            f.mesh.rotation.y += f.ry;
            f.mesh.rotation.z += f.rz;
            f.vy += this.gravity;
            f.life -= 0.02;
            
            // Shrink
            f.mesh.scale.setScalar(f.life);
            
            if (f.life <= 0) {
                this.scene.remove(f.mesh);
                this.fragments.splice(i, 1);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.updatePhysics();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game
window.onload = () => {
    new StackSmash();
};
