/**
 * Drop Merge Game Logic (Matter.js)
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
    playDrop() {
        this.playTone(300, 'sine', 0.1, 0.1);
    }
    playMerge(tierIndex) {
        const freq = 400 + (tierIndex * 50);
        this.playTone(freq, 'triangle', 0.2, 0.15);
    }
    playGameOver() {
        this.playTone(200, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.8, 0.2), 300);
    }
}

// Config for ball tiers
const TIERS = [
    { num: 2, radius: 15, color: '#f44336' },
    { num: 4, radius: 22, color: '#e91e63' },
    { num: 8, radius: 30, color: '#9c27b0' },
    { num: 16, radius: 38, color: '#673ab7' },
    { num: 32, radius: 48, color: '#3f51b5' },
    { num: 64, radius: 58, color: '#2196f3' },
    { num: 128, radius: 70, color: '#00bcd4' },
    { num: 256, radius: 82, color: '#4caf50' },
    { num: 512, radius: 95, color: '#ffeb3b' },
    { num: 1024, radius: 110, color: '#ff9800' },
    { num: 2048, radius: 125, color: '#795548' }
];

// Aliases for Matter.js
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Vector = Matter.Vector;

class DropMergeGame {
    constructor() {
        this.synth = new AudioSynth();
        this.score = 0;
        this.isGameOver = false;
        
        this.container = document.getElementById('game-container');
        this.canvas = document.getElementById('game-canvas');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.ctx = this.canvas.getContext('2d');
        
        this.scoreEl = document.getElementById('score');
        this.modal = document.getElementById('modal-overlay');
        this.dangerLine = document.getElementById('danger-line');
        
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.dropLineY = 50;
        this.dangerY = this.height * 0.15;
        this.dangerLine.style.top = `${this.dangerY}px`;
        
        this.engine = Engine.create();
        // Adjust gravity for a slightly bouncy, realistic feel
        this.engine.world.gravity.y = 1.2;
        
        this.runner = Runner.create();
        
        this.nextTierIndex = this.getRandomTier();
        this.pointerX = this.width / 2;
        this.canDrop = true;
        this.balls = [];
        
        this.init();
    }
    
    init() {
        this.createBoundaries();
        
        // Input events
        this.container.addEventListener('pointerdown', this.handleInputDown.bind(this));
        this.container.addEventListener('pointermove', this.handleInputMove.bind(this));
        this.container.addEventListener('pointerup', this.handleInputUp.bind(this));
        
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.modal.classList.add('hidden');
            this.resetGame();
        });
        
        // Collision Events
        Events.on(this.engine, 'collisionStart', this.handleCollision.bind(this));
        
        // Custom check before physics update
        Events.on(this.runner, 'beforeUpdate', () => {
            this.checkGameOverCondition();
        });
        
        // Start rendering
        requestAnimationFrame(this.render.bind(this));
        
        // Start physics
        Runner.run(this.runner, this.engine);
        
        this.drawNextPreview();
    }
    
    createBoundaries() {
        const wallOptions = { isStatic: true, render: { visible: false }, friction: 0.1, restitution: 0.2 };
        const ground = Bodies.rectangle(this.width / 2, this.height + 25, this.width, 50, wallOptions);
        const leftWall = Bodies.rectangle(-25, this.height / 2, 50, this.height * 2, wallOptions);
        const rightWall = Bodies.rectangle(this.width + 25, this.height / 2, 50, this.height * 2, wallOptions);
        
        Composite.add(this.engine.world, [ground, leftWall, rightWall]);
    }
    
    resetGame() {
        // Remove all balls
        this.balls.forEach(b => Composite.remove(this.engine.world, b.body));
        this.balls = [];
        
        this.score = 0;
        this.scoreEl.textContent = this.score;
        this.isGameOver = false;
        this.canDrop = true;
        this.container.classList.remove('danger-active');
        this.overflowTimer = null;
        
        this.nextTierIndex = this.getRandomTier();
        this.drawNextPreview();
    }
    
    getRandomTier() {
        // Spawn mostly tier 0, 1, 2
        const r = Math.random();
        if (r < 0.6) return 0;
        if (r < 0.9) return 1;
        return 2;
    }
    
    handleInputDown(e) {
        if (this.isGameOver) return;
        this.updatePointerX(e);
    }
    
    handleInputMove(e) {
        if (this.isGameOver) return;
        this.updatePointerX(e);
    }
    
    handleInputUp(e) {
        if (this.isGameOver) return;
        this.updatePointerX(e);
        this.dropBall();
    }
    
    updatePointerX(e) {
        const rect = this.container.getBoundingClientRect();
        let x = e.clientX - rect.left;
        
        const r = TIERS[this.nextTierIndex].radius;
        // Constrain to walls
        x = Math.max(r, Math.min(x, this.width - r));
        this.pointerX = x;
    }
    
    dropBall() {
        if (!this.canDrop || this.isGameOver) return;
        this.canDrop = false;
        
        // Init audio context
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        
        const tier = TIERS[this.nextTierIndex];
        const body = Bodies.circle(this.pointerX, this.dropLineY, tier.radius, {
            restitution: 0.3,
            friction: 0.2,
            density: 0.001 * (this.nextTierIndex + 1), // Heavier balls for larger numbers
            label: 'ball'
        });
        
        body.tierIndex = this.nextTierIndex;
        
        this.balls.push({
            body: body,
            tierIndex: this.nextTierIndex
        });
        
        Composite.add(this.engine.world, body);
        this.synth.playDrop();
        
        this.nextTierIndex = this.getRandomTier();
        this.drawNextPreview();
        
        // Cooldown before next drop
        setTimeout(() => {
            if (!this.isGameOver) this.canDrop = true;
        }, 800); // 800ms cooldown
    }
    
    handleCollision(event) {
        const pairs = event.pairs;
        const bodiesToRemove = new Set();
        
        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;
            
            if (bodyA.label === 'ball' && bodyB.label === 'ball') {
                if (bodyA.tierIndex === bodyB.tierIndex && !bodiesToRemove.has(bodyA) && !bodiesToRemove.has(bodyB)) {
                    // Maximum tier check
                    if (bodyA.tierIndex < TIERS.length - 1) {
                        bodiesToRemove.add(bodyA);
                        bodiesToRemove.add(bodyB);
                        
                        // Merge!
                        const newTierIndex = bodyA.tierIndex + 1;
                        const midPoint = {
                            x: (bodyA.position.x + bodyB.position.x) / 2,
                            y: (bodyA.position.y + bodyB.position.y) / 2
                        };
                        
                        this.score += TIERS[newTierIndex].num;
                        this.scoreEl.textContent = this.score;
                        
                        // Spawn new body
                        // We use setTimeout to defer creating the body to avoid mutating world during collision step
                        setTimeout(() => this.spawnMergedBall(midPoint.x, midPoint.y, newTierIndex), 0);
                        this.synth.playMerge(newTierIndex);
                    }
                }
            }
        }
        
        if (bodiesToRemove.size > 0) {
            bodiesToRemove.forEach(body => {
                Composite.remove(this.engine.world, body);
                this.balls = this.balls.filter(b => b.body !== body);
            });
        }
    }
    
    spawnMergedBall(x, y, tierIndex) {
        const tier = TIERS[tierIndex];
        const body = Bodies.circle(x, y, tier.radius, {
            restitution: 0.2,
            friction: 0.2,
            density: 0.001 * (tierIndex + 1),
            label: 'ball'
        });
        body.tierIndex = tierIndex;
        
        this.balls.push({ body: body, tierIndex: tierIndex });
        Composite.add(this.engine.world, body);
    }
    
    checkGameOverCondition() {
        if (this.isGameOver) return;
        
        let overflow = false;
        // Check if any settling ball is above danger line
        for (let ball of this.balls) {
            // A ball is considered overflowing if its top edge is above the danger line AND it's moving slowly
            if (ball.body.position.y - TIERS[ball.tierIndex].radius < this.dangerY) {
                if (ball.body.speed < 1) {
                    overflow = true;
                    break;
                }
            }
        }
        
        if (overflow) {
            if (!this.overflowTimer) {
                this.overflowTimer = Date.now();
                this.container.classList.add('danger-active');
            } else if (Date.now() - this.overflowTimer > 2000) {
                // Game Over after 2 seconds of overflow
                this.triggerGameOver();
            }
        } else {
            this.overflowTimer = null;
            this.container.classList.remove('danger-active');
        }
    }
    
    triggerGameOver() {
        this.isGameOver = true;
        this.canDrop = false;
        this.synth.playGameOver();
        
        document.getElementById('final-score').textContent = this.score;
        this.modal.classList.remove('hidden');
    }
    
    drawNextPreview() {
        const ctx = this.nextCtx;
        ctx.clearRect(0, 0, 60, 60);
        
        const tier = TIERS[this.nextTierIndex];
        // Scale down to fit in 60x60
        const scale = Math.min(1, 25 / tier.radius);
        const drawRadius = tier.radius * scale;
        
        ctx.save();
        ctx.translate(30, 30);
        
        // Draw Ball
        this.drawBall(ctx, 0, 0, drawRadius, tier, scale);
        
        ctx.restore();
    }
    
    drawBall(ctx, x, y, radius, tier, scale = 1) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        // Gradient fill
        const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.1, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, tier.color);
        grad.addColorStop(1, this.darkenColor(tier.color, 40));
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 2 * scale;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();
        
        // Number
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Adjust font size based on number of digits and radius
        const numStr = tier.num.toString();
        let fontSize = radius * 1.2;
        if (numStr.length > 2) fontSize = radius;
        if (numStr.length > 3) fontSize = radius * 0.8;
        
        ctx.font = `bold ${fontSize}px Fredoka, sans-serif`;
        
        // Text shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4 * scale;
        ctx.shadowOffsetX = 1 * scale;
        ctx.shadowOffsetY = 1 * scale;
        
        ctx.fillText(numStr, x, y);
        ctx.shadowColor = 'transparent'; // Reset
    }
    
    darkenColor(hex, amount) {
        let color = hex.replace('#', '');
        if (color.length === 3) color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
        let r = parseInt(color.substring(0,2), 16) - amount;
        let g = parseInt(color.substring(2,4), 16) - amount;
        let b = parseInt(color.substring(4,6), 16) - amount;
        r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw Dropper line and active ball if can drop
        if (this.canDrop && !this.isGameOver) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.pointerX, this.dropLineY);
            this.ctx.lineTo(this.pointerX, this.height);
            this.ctx.setLineDash([5, 10]);
            this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            const tier = TIERS[this.nextTierIndex];
            this.drawBall(this.ctx, this.pointerX, this.dropLineY, tier.radius, tier);
        }
        
        // Draw all active balls
        for (let ball of this.balls) {
            const pos = ball.body.position;
            const tier = TIERS[ball.tierIndex];
            
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            this.ctx.rotate(ball.body.angle);
            this.drawBall(this.ctx, 0, 0, tier.radius, tier);
            this.ctx.restore();
        }
        
        requestAnimationFrame(this.render.bind(this));
    }
}

window.onload = () => {
    new DropMergeGame();
};
