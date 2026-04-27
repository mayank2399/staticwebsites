/**
 * Tap Timing Game Logic
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
    playPerfect() {
        // High bright bell
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1600, 'sine', 0.2, 0.1), 50);
    }
    playGood() {
        // Mid chime
        this.playTone(800, 'triangle', 0.15, 0.1);
    }
    playMiss() {
        // Dull buzzer
        this.playTone(200, 'sawtooth', 0.3, 0.2);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class TapTimingGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.synth = new AudioSynth();
        
        this.scoreDisplay = document.getElementById('score-display');
        this.bestDisplay = document.getElementById('best-display');
        this.startOverlay = document.getElementById('start-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.feedbackContainer = document.getElementById('feedback-container');
        
        this.score = 0;
        this.bestScore = localStorage.getItem('tapTimingBest') || 0;
        this.bestDisplay.textContent = this.bestScore;
        
        this.isPlaying = false;
        
        // Game State
        this.cx = 0;
        this.cy = 0;
        this.radius = 120;
        
        this.angle = 0;
        this.baseSpeed = 0.04;
        this.speed = this.baseSpeed;
        this.direction = 1; // 1 or -1
        
        this.targetAngle = 0;
        this.targetSize = 0.25; // Radians threshold for "Good"
        this.perfectSize = 0.08; // Radians threshold for "Perfect"
        
        this.particles = [];
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
        
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
        
        requestAnimationFrame(this.loop.bind(this));
        
        // Initial draw
        this.setNewTarget();
        this.draw();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cx = this.canvas.width / 2;
        this.cy = this.canvas.height / 2;
        this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    }
    
    startGame() {
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.score = 0;
        this.scoreDisplay.textContent = '0';
        this.speed = this.baseSpeed;
        this.direction = 1;
        this.angle = -Math.PI / 2; // Top
        this.particles = [];
        this.setNewTarget();
        this.isPlaying = true;
    }
    
    setNewTarget() {
        // Target angle should be somewhere ahead of current angle
        // Distance between PI/4 and PI
        let dist = (Math.PI / 4) + Math.random() * (Math.PI * 0.75);
        this.targetAngle = this.angle + (this.direction * dist);
        
        // Normalize
        this.targetAngle = this.normalizeAngle(this.targetAngle);
    }
    
    normalizeAngle(a) {
        while (a < 0) a += Math.PI * 2;
        while (a >= Math.PI * 2) a -= Math.PI * 2;
        return a;
    }
    
    getAngleDiff(a, b) {
        let diff = Math.abs(a - b);
        if (diff > Math.PI) {
            diff = Math.PI * 2 - diff;
        }
        return diff;
    }
    
    handleTap() {
        if (!this.isPlaying) return;
        
        const diff = this.getAngleDiff(this.normalizeAngle(this.angle), this.targetAngle);
        
        if (diff <= this.perfectSize) {
            // Perfect
            this.synth.playPerfect();
            this.score += 2;
            this.showFeedback('PERFECT!', 'feedback-perfect');
            this.spawnParticles('#00ffcc');
            this.hitSuccess();
        } else if (diff <= this.targetSize) {
            // Good
            this.synth.playGood();
            this.score += 1;
            this.showFeedback('GOOD', 'feedback-good');
            this.spawnParticles('#ffcc00');
            this.hitSuccess();
        } else {
            // Miss
            this.triggerGameOver();
        }
    }
    
    hitSuccess() {
        this.scoreDisplay.textContent = this.score;
        this.direction *= -1; // Reverse
        this.speed += 0.002; // Speed up
        this.setNewTarget();
    }
    
    triggerGameOver() {
        this.isPlaying = false;
        this.synth.playMiss();
        this.showFeedback('MISS', 'feedback-miss');
        
        // Screen shake
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 300);
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('tapTimingBest', this.bestScore);
            this.bestDisplay.textContent = this.bestScore;
        }
        
        setTimeout(() => {
            this.gameoverOverlay.classList.remove('hidden');
        }, 800);
    }
    
    showFeedback(text, className) {
        const el = document.createElement('div');
        el.className = `feedback-text ${className}`;
        el.textContent = text;
        
        // Slight random offset
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        el.style.marginLeft = `${offsetX}px`;
        el.style.marginTop = `${offsetY}px`;
        
        this.feedbackContainer.appendChild(el);
        
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 800);
    }
    
    spawnParticles(color) {
        // Spawn particles at target position
        const tx = this.cx + Math.cos(this.targetAngle) * this.radius;
        const ty = this.cy + Math.sin(this.targetAngle) * this.radius;
        
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(tx, ty, color));
        }
    }
    
    update(dt) {
        if (this.isPlaying) {
            // dt based update to ensure smooth speeds regardless of frame rate
            const timeScale = dt / 16.66; // 60fps baseline
            
            this.angle += this.speed * this.direction * timeScale;
            
            // Check if cursor completely missed the target by going past it
            let dirDiff = this.targetAngle - this.normalizeAngle(this.angle);
            if (dirDiff > Math.PI) dirDiff -= Math.PI * 2;
            if (dirDiff < -Math.PI) dirDiff += Math.PI * 2;
            
            // If direction is 1 (clockwise), dirDiff should be positive. If it becomes negative, we passed it.
            // Add a small buffer so it misses visually accurately
            if (this.direction === 1 && dirDiff < -this.targetSize) {
                this.triggerGameOver();
            } else if (this.direction === -1 && dirDiff > this.targetSize) {
                this.triggerGameOver();
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Track
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 15;
        this.ctx.stroke();
        
        // Draw Target Zone
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, this.radius, this.targetAngle - this.targetSize, this.targetAngle + this.targetSize);
        this.ctx.strokeStyle = 'var(--good)';
        this.ctx.lineWidth = 20;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = 'var(--good)';
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
        
        // Draw Perfect Zone inside target
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, this.radius, this.targetAngle - this.perfectSize, this.targetAngle + this.perfectSize);
        this.ctx.strokeStyle = 'var(--perfect)';
        this.ctx.lineWidth = 20;
        this.ctx.shadowColor = 'var(--perfect)';
        this.ctx.shadowBlur = 20;
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.lineCap = 'butt';
        
        // Draw Cursor
        const px = this.cx + Math.cos(this.angle) * this.radius;
        const py = this.cy + Math.sin(this.angle) * this.radius;
        
        this.ctx.beginPath();
        this.ctx.arc(px, py, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = 'var(--text-light)';
        this.ctx.shadowColor = 'white';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0; // reset
        
        // Draw Center Dot
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = 'var(--primary)';
        this.ctx.fill();
        
        // Draw particles
        this.particles.forEach(p => p.draw(this.ctx));
    }
    
    loop(time) {
        requestAnimationFrame(this.loop.bind(this));
        
        const dt = time - this.lastTime;
        this.lastTime = time;
        
        if (dt > 100) return; // Cap dt
        
        this.update(dt);
        this.draw();
    }
}

window.onload = () => {
    new TapTimingGame();
};
