/**
 * Draw to Save Game Logic (Matter.js + Canvas)
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
    playDraw() {
        // Soft white noise for pencil effect
        if (this.ctx.state === 'suspended') this.ctx.resume();
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
        filter.frequency.value = 1000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    playHit() {
        this.playTone(150, 'sawtooth', 0.2, 0.2);
    }
    playWin() {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.15, 0.1), i * 100));
    }
    playLose() {
        [300, 250, 200].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.2, 0.2), i * 150));
    }
}

class DrawToSave {
    constructor() {
        this.synth = new AudioSynth();
        
        // Logical resolution
        this.WIDTH = 800;
        this.HEIGHT = 600;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Scale canvas to fit screen
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // UI Elements
        this.levelDisplay = document.getElementById('level-display');
        this.inkBar = document.getElementById('ink-bar');
        this.overlayStart = document.getElementById('overlay-start');
        this.overlayGameOver = document.getElementById('overlay-gameover');
        this.overlayWin = document.getElementById('overlay-win');
        this.countdownText = document.getElementById('countdown-text');
        
        // Game State
        this.levels = [];
        this.currentLevelIndex = 0;
        
        this.isDrawing = false;
        this.hasDrawn = false;
        this.isSimulating = false;
        this.isGameOver = false;
        
        this.drawPoints = [];
        this.inkRemaining = 100;
        this.inkLimit = 100;
        
        this.drawnBody = null;
        this.characterBody = null;
        this.hazards = []; 
        
        this.simulationTimer = 0;
        this.maxSimulationTime = 3000; // 3 seconds to survive
        
        // Matter.js Aliases
        this.Engine = Matter.Engine;
        this.World = Matter.World;
        this.Bodies = Matter.Bodies;
        this.Body = Matter.Body;
        this.Composite = Matter.Composite;
        this.Events = Matter.Events;
        
        this.engine = this.Engine.create();
        
        this.bindEvents();
        this.init();
    }
    
    async init() {
        await this.loadLevels();
        this.startLevel();
        requestAnimationFrame(this.loop.bind(this));
    }
    
    resizeCanvas() {
        const scale = Math.min(window.innerWidth / this.WIDTH, window.innerHeight / this.HEIGHT);
        this.canvas.style.width = `${this.WIDTH * scale}px`;
        this.canvas.style.height = `${this.HEIGHT * scale}px`;
        
        // Store scale and rect for accurate pointer mapping
        this.scale = scale;
    }
    
    getPointerPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Handle both touch and mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: (clientX - rect.left) / this.scale,
            y: (clientY - rect.top) / this.scale
        };
    }
    
    bindEvents() {
        // UI Buttons
        document.getElementById('btn-start').addEventListener('click', () => {
            this.overlayStart.classList.add('hidden');
            this.startLevel();
        });
        
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.overlayGameOver.classList.add('hidden');
            this.startLevel();
        });
        
        document.getElementById('btn-next').addEventListener('click', () => {
            this.overlayWin.classList.add('hidden');
            this.currentLevelIndex++;
            if (this.currentLevelIndex >= this.levels.length) this.currentLevelIndex = 0;
            this.startLevel();
        });
        
        // Drawing Input
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.isSimulating || this.hasDrawn || this.isGameOver) return;
            if (e.target.tagName === 'BUTTON') return;
            
            if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
            
            this.isDrawing = true;
            this.drawPoints = [this.getPointerPos(e)];
        });
        
        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isDrawing) return;
            
            const pos = this.getPointerPos(e);
            const lastPos = this.drawPoints[this.drawPoints.length - 1];
            
            const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
            if (dist > 5) {
                // Check ink
                if (this.inkRemaining > 0) {
                    this.drawPoints.push(pos);
                    this.inkRemaining -= dist;
                    this.updateInkBar();
                    this.synth.playDraw();
                } else {
                    this.finishDrawing();
                }
            }
        });
        
        window.addEventListener('pointerup', () => {
            if (this.isDrawing) {
                this.finishDrawing();
            }
        });
        
        // Collision Events
        this.Events.on(this.engine, 'collisionStart', (event) => {
            if (this.isGameOver) return;
            
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;
                
                // Play hit sound for general hard impacts
                if (pairs[i].collision.depth > 2) {
                    this.synth.playHit();
                }
                
                // Check character hit hazard
                if ((bodyA.label === 'character' && bodyB.label === 'hazard') ||
                    (bodyB.label === 'character' && bodyA.label === 'hazard')) {
                    this.triggerGameOver();
                }
            }
        });
    }
    
    updateInkBar() {
        const pct = Math.max(0, (this.inkRemaining / this.inkLimit) * 100);
        this.inkBar.style.width = `${pct}%`;
        if (pct < 20) this.inkBar.style.background = '#d63031';
        else this.inkBar.style.background = 'var(--ink)';
    }
    
    finishDrawing() {
        this.isDrawing = false;
        this.hasDrawn = true;
        
        if (this.drawPoints.length > 1) {
            // Convert points to Matter.js compound body
            const parts = [];
            const thickness = 10;
            
            for (let i = 0; i < this.drawPoints.length - 1; i++) {
                const p1 = this.drawPoints[i];
                const p2 = this.drawPoints[i+1];
                
                const cx = (p1.x + p2.x) / 2;
                const cy = (p1.y + p2.y) / 2;
                const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                
                const rect = this.Bodies.rectangle(cx, cy, length + thickness/2, thickness, {
                    angle: angle,
                    friction: 0.8,
                    restitution: 0.1,
                    render: { visible: false }
                });
                parts.push(rect);
            }
            
            // Calculate center of mass for the compound body
            this.drawnBody = this.Body.create({
                parts: parts,
                friction: 0.8,
                restitution: 0.1,
                density: 0.05
            });
            
            this.World.add(this.engine.world, this.drawnBody);
        }
        
        // Start simulation
        this.isSimulating = true;
        this.simulationTimer = this.maxSimulationTime;
        this.countdownText.classList.remove('hidden');
        
        // Unfreeze hazards and character
        this.Body.setStatic(this.characterBody, false);
        this.hazards.forEach(h => {
            this.Body.setStatic(h, false);
        });
    }
    
    async loadLevels() {
        try {
            const res = await fetch('levels/levels.json');
            this.levels = await res.json();
        } catch(e) {
            console.error("Using fallback levels");
            this.levels = [
                {
                    "id": 1,
                    "inkLimit": 300,
                    "terrain": [
                        {"x": 400, "y": 500, "w": 400, "h": 50}
                    ],
                    "character": {"x": 400, "y": 450},
                    "hazards": [
                        {"type": "bomb", "x": 400, "y": 100, "r": 20}
                    ]
                },
                {
                    "id": 2,
                    "inkLimit": 400,
                    "terrain": [
                        {"x": 200, "y": 400, "w": 200, "h": 20},
                        {"x": 600, "y": 400, "w": 200, "h": 20}
                    ],
                    "character": {"x": 200, "y": 350},
                    "hazards": [
                        {"type": "bomb", "x": 200, "y": 50, "r": 20},
                        {"type": "bomb", "x": 600, "y": 50, "r": 20}
                    ]
                },
                {
                    "id": 3,
                    "inkLimit": 500,
                    "terrain": [
                        {"x": 150, "y": 300, "w": 200, "h": 20},
                        {"x": 650, "y": 300, "w": 200, "h": 20},
                        {"x": 400, "y": 550, "w": 800, "h": 50}
                    ],
                    "character": {"x": 400, "y": 450},
                    "hazards": [
                        {"type": "spike", "x": 400, "y": 510, "w": 400, "h": 30},
                        {"type": "bomb", "x": 400, "y": 50, "r": 30}
                    ]
                }
            ];
        }
    }
    
    startLevel() {
        this.Engine.clear(this.engine);
        this.World.clear(this.engine.world);
        
        this.isDrawing = false;
        this.hasDrawn = false;
        this.isSimulating = false;
        this.isGameOver = false;
        this.drawPoints = [];
        this.drawnBody = null;
        this.hazards = [];
        this.countdownText.classList.add('hidden');
        
        const levelData = this.levels[this.currentLevelIndex];
        this.levelDisplay.textContent = `LEVEL ${this.currentLevelIndex + 1}`;
        
        this.inkLimit = levelData.inkLimit;
        this.inkRemaining = this.inkLimit;
        this.updateInkBar();
        
        // Add Bounds (Walls)
        const walls = [
            this.Bodies.rectangle(this.WIDTH/2, -1000, this.WIDTH, 50, { isStatic: true }), // Top
            this.Bodies.rectangle(this.WIDTH/2, this.HEIGHT + 500, this.WIDTH*2, 50, { isStatic: true, label: 'bottom_kill' }), // Bottom killzone
            this.Bodies.rectangle(-50, this.HEIGHT/2, 50, this.HEIGHT*2, { isStatic: true }), // Left
            this.Bodies.rectangle(this.WIDTH+50, this.HEIGHT/2, 50, this.HEIGHT*2, { isStatic: true }) // Right
        ];
        this.World.add(this.engine.world, walls);
        
        // Add Terrain
        levelData.terrain.forEach(t => {
            const block = this.Bodies.rectangle(t.x, t.y, t.w, t.h, { 
                isStatic: true,
                friction: 0.8,
                label: 'terrain'
            });
            // Store size for rendering
            block.renderParams = { w: t.w, h: t.h };
            this.World.add(this.engine.world, block);
        });
        
        // Add Character (Circle)
        const cData = levelData.character;
        this.characterBody = this.Bodies.circle(cData.x, cData.y, 20, {
            label: 'character',
            isStatic: true, // Frozen until draw finishes
            friction: 0.5,
            restitution: 0.2,
            density: 0.005
        });
        this.World.add(this.engine.world, this.characterBody);
        
        // Add Hazards
        levelData.hazards.forEach(h => {
            let body;
            if (h.type === 'bomb') {
                body = this.Bodies.circle(h.x, h.y, h.r, {
                    label: 'hazard',
                    isStatic: true, // Frozen until draw finishes
                    restitution: 0.5,
                    density: 0.01
                });
                body.renderParams = { type: 'bomb', r: h.r };
            } else if (h.type === 'spike') {
                // Spikes are static hazards on the ground usually
                body = this.Bodies.rectangle(h.x, h.y, h.w, h.h, {
                    label: 'hazard',
                    isStatic: true
                });
                body.renderParams = { type: 'spike', w: h.w, h: h.h };
            }
            this.hazards.push(body);
            this.World.add(this.engine.world, body);
        });
    }
    
    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isSimulating = false;
        this.countdownText.classList.add('hidden');
        this.synth.playLose();
        this.overlayGameOver.classList.remove('hidden');
    }
    
    triggerWin() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isSimulating = false;
        this.countdownText.classList.add('hidden');
        this.synth.playWin();
        this.overlayWin.classList.remove('hidden');
    }
    
    update(dt) {
        if (this.isSimulating && !this.isGameOver) {
            this.Engine.update(this.engine, 1000 / 60); // Fixed time step for stability
            
            // Fall off screen check
            if (this.characterBody.position.y > this.HEIGHT + 50) {
                this.triggerGameOver();
            }
            
            // Countdown
            this.simulationTimer -= dt;
            this.countdownText.textContent = Math.ceil(this.simulationTimer / 1000);
            
            if (this.simulationTimer <= 0) {
                this.triggerWin();
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        
        // Draw Terrain
        this.ctx.fillStyle = '#2d3436';
        this.engine.world.bodies.forEach(b => {
            if (b.label === 'terrain') {
                this.ctx.save();
                this.ctx.translate(b.position.x, b.position.y);
                this.ctx.rotate(b.angle);
                this.ctx.fillRect(-b.renderParams.w/2, -b.renderParams.h/2, b.renderParams.w, b.renderParams.h);
                this.ctx.restore();
            }
        });
        
        // Draw Hazards
        this.engine.world.bodies.forEach(b => {
            if (b.label === 'hazard') {
                this.ctx.save();
                this.ctx.translate(b.position.x, b.position.y);
                this.ctx.rotate(b.angle);
                
                if (b.renderParams.type === 'bomb') {
                    this.ctx.fillStyle = '#d63031';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, b.renderParams.r, 0, Math.PI*2);
                    this.ctx.fill();
                    
                    // Bomb face
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(-8, -5, 4, 4);
                    this.ctx.fillRect(4, -5, 4, 4);
                    this.ctx.fillRect(-5, 5, 10, 2);
                } else if (b.renderParams.type === 'spike') {
                    this.ctx.fillStyle = '#d63031';
                    // Draw zigzag spikes
                    const w = b.renderParams.w;
                    const h = b.renderParams.h;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-w/2, h/2);
                    for (let x = -w/2; x <= w/2; x += 20) {
                        this.ctx.lineTo(x, -h/2);
                        this.ctx.lineTo(Math.min(x+10, w/2), h/2);
                    }
                    this.ctx.fill();
                }
                
                this.ctx.restore();
            }
        });
        
        // Draw Character
        if (this.characterBody) {
            this.ctx.save();
            this.ctx.translate(this.characterBody.position.x, this.characterBody.position.y);
            this.ctx.rotate(this.characterBody.angle);
            
            // Body
            this.ctx.fillStyle = '#0984e3';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = '#2d3436';
            this.ctx.stroke();
            
            // Eyes
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(-7, -5, 6, 0, Math.PI*2);
            this.ctx.arc(7, -5, 6, 0, Math.PI*2);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'black';
            this.ctx.beginPath();
            this.ctx.arc(-7, -5, 2, 0, Math.PI*2);
            this.ctx.arc(7, -5, 2, 0, Math.PI*2);
            this.ctx.fill();
            
            // Mouth
            this.ctx.beginPath();
            if (this.isGameOver) {
                this.ctx.arc(0, 8, 4, Math.PI, 0); // Sad
            } else {
                this.ctx.arc(0, 5, 4, 0, Math.PI); // Smile
            }
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        // Draw the Ink (Active drawing trail or the solidified body)
        this.ctx.strokeStyle = 'var(--ink)';
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.drawnBody) {
            // Draw from compound body parts
            this.ctx.fillStyle = 'var(--ink)';
            // In a compound body, parts[0] is the hull. parts[1..n] are the actual pieces.
            for (let i = 1; i < this.drawnBody.parts.length; i++) {
                const part = this.drawnBody.parts[i];
                this.ctx.beginPath();
                this.ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
                for (let j = 1; j < part.vertices.length; j++) {
                    this.ctx.lineTo(part.vertices[j].x, part.vertices[j].y);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
        } else if (this.drawPoints.length > 0) {
            // Actively drawing trail
            this.ctx.beginPath();
            this.ctx.moveTo(this.drawPoints[0].x, this.drawPoints[0].y);
            for (let i = 1; i < this.drawPoints.length; i++) {
                this.ctx.lineTo(this.drawPoints[i].x, this.drawPoints[i].y);
            }
            this.ctx.stroke();
        }
    }
    
    loop(time) {
        requestAnimationFrame(this.loop.bind(this));
        
        const dt = time - (this.lastTime || time);
        this.lastTime = time;
        
        this.update(dt);
        this.draw();
    }
}

window.onload = () => {
    new DrawToSave();
};
