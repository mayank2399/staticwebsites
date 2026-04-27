/**
 * Screw Puzzle Game Logic
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
    playRatchet() {
        // Simulating a ratchet / unscrewing sound
        if (this.ctx.state === 'suspended') this.ctx.resume();
        let time = this.ctx.currentTime;
        for (let i = 0; i < 5; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 800 + Math.random() * 200;
            gain.gain.setValueAtTime(0.05, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.05);
            time += 0.05;
        }
    }
    playError() {
        this.playTone(150, 'sawtooth', 0.2, 0.2);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.3, 0.2), 100);
    }
    playWin() {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.15, 0.1), i * 100));
    }
}

class ScrewPuzzle {
    constructor() {
        this.synth = new AudioSynth();
        
        this.boardEl = document.getElementById('board');
        this.screwLayer = document.getElementById('screw-layer');
        this.wireLayer = document.getElementById('wire-layer');
        this.levelDisplay = document.getElementById('level-display');
        
        this.overlayStart = document.getElementById('overlay-start');
        this.overlayWin = document.getElementById('overlay-win');
        
        this.levels = [];
        this.currentLevelIndex = 0;
        
        this.screws = []; // Current level screw data
        this.removedScrews = new Set();
        
        this.isAnimating = false;
        
        this.init();
    }
    
    async init() {
        await this.loadLevels();
        this.bindEvents();
    }
    
    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.overlayStart.classList.add('hidden');
            if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
            this.startLevel();
        });
        
        document.getElementById('btn-next').addEventListener('click', () => {
            this.overlayWin.classList.add('hidden');
            this.currentLevelIndex++;
            if (this.currentLevelIndex >= this.levels.length) this.currentLevelIndex = 0; // Loop
            this.startLevel();
        });
        
        // Handle window resize to redraw SVG wires properly
        window.addEventListener('resize', () => {
            this.renderWires();
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
                    "screws": [
                        { "id": "s1", "x": 30, "y": 50, "deps": [] },
                        { "id": "s2", "x": 70, "y": 50, "deps": ["s1"] }
                    ]
                },
                {
                    "id": 2,
                    "screws": [
                        { "id": "s1", "x": 50, "y": 20, "deps": [] },
                        { "id": "s2", "x": 30, "y": 70, "deps": ["s1"] },
                        { "id": "s3", "x": 70, "y": 70, "deps": ["s1"] }
                    ]
                },
                {
                    "id": 3,
                    "screws": [
                        { "id": "s1", "x": 20, "y": 30, "deps": [] },
                        { "id": "s2", "x": 80, "y": 30, "deps": [] },
                        { "id": "s3", "x": 50, "y": 50, "deps": ["s1", "s2"] },
                        { "id": "s4", "x": 50, "y": 80, "deps": ["s3"] }
                    ]
                }
            ];
        }
    }
    
    startLevel() {
        const levelData = this.levels[this.currentLevelIndex];
        this.levelDisplay.textContent = `LEVEL ${this.currentLevelIndex + 1}`;
        
        // Deep copy screws
        this.screws = JSON.parse(JSON.stringify(levelData.screws));
        this.removedScrews.clear();
        this.isAnimating = false;
        
        this.render();
    }
    
    render() {
        this.screwLayer.innerHTML = '';
        
        this.screws.forEach(s => {
            if (this.removedScrews.has(s.id)) return;
            
            const isLocked = s.deps.some(depId => !this.removedScrews.has(depId));
            
            const el = document.createElement('div');
            el.className = `screw ${isLocked ? 'locked' : 'unlocked'}`;
            el.style.left = `${s.x}%`;
            el.style.top = `${s.y}%`;
            el.dataset.id = s.id;
            
            el.addEventListener('click', (e) => this.handleScrewClick(s, el));
            
            this.screwLayer.appendChild(el);
            s.el = el;
        });
        
        this.renderWires();
    }
    
    renderWires() {
        this.wireLayer.innerHTML = '';
        
        const boardRect = this.boardEl.getBoundingClientRect();
        
        // Draw lines from dependencies TO the screw depending on them
        // So: Dep -> Target
        this.screws.forEach(target => {
            if (this.removedScrews.has(target.id)) return;
            
            target.deps.forEach(depId => {
                if (this.removedScrews.has(depId)) return;
                
                const dep = this.screws.find(s => s.id === depId);
                
                // Calculate absolute coordinates based on %
                const x1 = (dep.x / 100) * boardRect.width;
                const y1 = (dep.y / 100) * boardRect.height;
                const x2 = (target.x / 100) * boardRect.width;
                const y2 = (target.y / 100) * boardRect.height;
                
                // Check if the dependency is currently locked itself (makes wire inactive)
                const isDepLocked = dep.deps.some(d => !this.removedScrews.has(d));
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('class', `wire ${isDepLocked ? 'inactive' : 'active'}`);
                
                this.wireLayer.appendChild(line);
            });
        });
    }
    
    handleScrewClick(screwData, el) {
        if (this.isAnimating) return;
        
        const isLocked = screwData.deps.some(depId => !this.removedScrews.has(depId));
        
        if (isLocked) {
            // Error
            this.synth.playError();
            el.classList.remove('anim-error');
            void el.offsetWidth; // trigger reflow
            el.classList.add('anim-error');
        } else {
            // Success
            this.isAnimating = true;
            this.synth.playRatchet();
            
            el.classList.add('anim-unscrew');
            
            // Wait for animation to finish
            setTimeout(() => {
                this.removedScrews.add(screwData.id);
                this.isAnimating = false;
                
                // Check win
                if (this.removedScrews.size === this.screws.length) {
                    this.triggerWin();
                } else {
                    this.render(); // Re-render updates lock states and wires
                }
            }, 400);
        }
    }
    
    triggerWin() {
        this.synth.playWin();
        this.screwLayer.innerHTML = '';
        this.wireLayer.innerHTML = '';
        this.overlayWin.classList.remove('hidden');
    }
}

window.onload = () => {
    new ScrewPuzzle();
};
