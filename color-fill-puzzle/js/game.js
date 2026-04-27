/**
 * Color Fill Puzzle Game Logic
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
    playFill(dist) {
        // Higher pitch for further distance
        this.playTone(300 + (dist * 20), 'sine', 0.1, 0.05);
    }
    playError() {
        this.playTone(150, 'square', 0.1, 0.1);
    }
    playGameOver() {
        this.playTone(200, 'sawtooth', 0.3, 0.2);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.2), 200);
    }
    playLevelUp() {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.15, 0.1), i * 100));
    }
}

class ColorFillGame {
    constructor() {
        this.synth = new AudioSynth();
        
        this.gridEl = document.getElementById('grid');
        this.paletteEl = document.getElementById('palette');
        this.levelDisplay = document.getElementById('level-display');
        this.movesDisplay = document.getElementById('moves-display');
        this.modal = document.getElementById('modal-overlay');
        
        this.levels = [];
        this.currentLevelIndex = 0;
        this.movesRemaining = 0;
        
        this.grid = []; // 2D array of color IDs
        this.cells = []; // 2D array of DOM elements
        this.size = 0;
        this.numColors = 0;
        
        this.isAnimating = false;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadLevels();
        this.startLevel();
    }
    
    bindEvents() {
        document.getElementById('btn-next').addEventListener('click', () => {
            this.modal.classList.add('hidden');
            if (this.isWinState) {
                this.currentLevelIndex++;
                if (this.currentLevelIndex >= this.levels.length) {
                    // Loop back to start if finished all levels
                    this.currentLevelIndex = 0;
                }
            }
            this.startLevel();
        });
    }
    
    async loadLevels() {
        try {
            const res = await fetch('levels/levels.json');
            this.levels = await res.json();
        } catch (e) {
            console.error('Failed to load levels, using fallbacks.', e);
            this.levels = [
                { "id": 1, "size": 6, "colors": 3, "moves": 10 },
                { "id": 2, "size": 8, "colors": 4, "moves": 16 },
                { "id": 3, "size": 10, "colors": 5, "moves": 22 },
                { "id": 4, "size": 12, "colors": 6, "moves": 28 },
                { "id": 5, "size": 14, "colors": 6, "moves": 34 }
            ];
        }
    }
    
    startLevel() {
        this.isWinState = false;
        const levelData = this.levels[this.currentLevelIndex];
        
        this.size = levelData.size;
        this.numColors = levelData.colors;
        this.movesRemaining = levelData.moves;
        
        this.levelDisplay.textContent = this.currentLevelIndex + 1;
        this.updateMovesDisplay();
        
        this.generateGrid();
        this.generatePalette();
    }
    
    generateGrid() {
        this.gridEl.innerHTML = '';
        this.gridEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.gridEl.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
        
        this.grid = [];
        this.cells = [];
        
        for (let y = 0; y < this.size; y++) {
            this.grid[y] = [];
            this.cells[y] = [];
            for (let x = 0; x < this.size; x++) {
                // Ensure the top-left color doesn't instantly match adjacent too much,
                // but random is generally fine.
                const colorId = Math.floor(Math.random() * this.numColors);
                this.grid[y][x] = colorId;
                
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.backgroundColor = `var(--c${colorId})`;
                
                this.gridEl.appendChild(cell);
                this.cells[y][x] = cell;
            }
        }
    }
    
    generatePalette() {
        this.paletteEl.innerHTML = '';
        for (let i = 0; i < this.numColors; i++) {
            const btn = document.createElement('div');
            btn.className = 'color-btn';
            btn.style.backgroundColor = `var(--c${i})`;
            btn.addEventListener('pointerdown', () => this.handleColorClick(i));
            this.paletteEl.appendChild(btn);
        }
    }
    
    updateMovesDisplay() {
        this.movesDisplay.textContent = this.movesRemaining;
        if (this.movesRemaining <= 3) {
            this.movesDisplay.style.color = '#ff4757';
        } else {
            this.movesDisplay.style.color = '#ffa502';
        }
    }
    
    handleColorClick(targetColor) {
        if (this.isAnimating || this.movesRemaining <= 0) return;
        
        const originColor = this.grid[0][0];
        if (originColor === targetColor) {
            if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
            this.synth.playError();
            return;
        }
        
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        
        this.movesRemaining--;
        this.updateMovesDisplay();
        
        this.isAnimating = true;
        this.floodFill(targetColor, originColor);
    }
    
    floodFill(targetColor, originColor) {
        // BFS to find all connected cells of originColor
        const queue = [[0, 0]];
        const visited = Array.from({length: this.size}, () => Array(this.size).fill(false));
        visited[0][0] = true;
        
        // Track cells by distance to animate them as a wave
        const cellsByDist = [];
        
        while(queue.length > 0) {
            const [x, y] = queue.shift();
            
            // Dist is simply Manhattan distance from origin for animation purposes
            const dist = x + y;
            if (!cellsByDist[dist]) cellsByDist[dist] = [];
            cellsByDist[dist].push({x, y});
            
            this.grid[y][x] = targetColor;
            
            // Check neighbors
            const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
            for (const [dx, dy] of dirs) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
                    if (!visited[ny][nx] && this.grid[ny][nx] === originColor) {
                        visited[ny][nx] = true;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
        
        // Animate
        let maxDist = cellsByDist.length - 1;
        
        cellsByDist.forEach((cellGroup, dist) => {
            setTimeout(() => {
                cellGroup.forEach(({x, y}) => {
                    const el = this.cells[y][x];
                    el.style.backgroundColor = `var(--c${targetColor})`;
                    
                    // Pop animation
                    el.classList.add('pop');
                    setTimeout(() => el.classList.remove('pop'), 200);
                });
                
                this.synth.playFill(dist);
                
                if (dist === maxDist) {
                    setTimeout(() => {
                        this.isAnimating = false;
                        this.checkGameState();
                    }, 200);
                }
            }, dist * 50); // 50ms delay per distance step
        });
        
        // If nothing was filled (shouldn't happen since origin always changes), reset lock
        if (cellsByDist.length === 0) {
            this.isAnimating = false;
            this.checkGameState();
        }
    }
    
    checkGameState() {
        const targetColor = this.grid[0][0];
        let isWin = true;
        
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.grid[y][x] !== targetColor) {
                    isWin = false;
                    break;
                }
            }
            if (!isWin) break;
        }
        
        if (isWin) {
            this.isWinState = true;
            this.synth.playLevelUp();
            document.getElementById('modal-title').textContent = "LEVEL CLEARED!";
            document.getElementById('modal-title').style.color = "#2ed573";
            document.getElementById('modal-desc').textContent = "Great job!";
            document.getElementById('btn-next').textContent = "NEXT LEVEL";
            this.modal.classList.remove('hidden');
        } else if (this.movesRemaining <= 0) {
            this.isWinState = false;
            this.synth.playGameOver();
            document.getElementById('modal-title').textContent = "GAME OVER";
            document.getElementById('modal-title').style.color = "#ff4757";
            document.getElementById('modal-desc').textContent = "Out of moves!";
            document.getElementById('btn-next').textContent = "RETRY";
            this.modal.classList.remove('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ColorFillGame();
});
