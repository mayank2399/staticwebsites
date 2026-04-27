/**
 * Parking Jam Game Logic
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
    playSlide() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
    playThud() {
        this.playTone(100, 'square', 0.1, 0.1);
    }
    playWin() {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.15, 0.1), i * 100));
    }
}

class ParkingJam {
    constructor() {
        this.synth = new AudioSynth();
        
        this.boardEl = document.getElementById('board');
        this.carsLayer = document.getElementById('cars-layer');
        this.levelDisplay = document.getElementById('level-display');
        this.moveCounterDisplay = document.getElementById('move-counter');
        
        this.overlayStart = document.getElementById('overlay-start');
        this.overlayWin = document.getElementById('overlay-win');
        
        this.levels = [];
        this.currentLevelIndex = 0;
        
        this.gridSize = 6;
        this.vehicles = []; // logical state
        this.grid = []; // 2D array representation
        
        this.moves = 0;
        
        // Drag state
        this.isDragging = false;
        this.dragCar = null;
        this.dragStartObj = {};
        this.cellSize = 0;
        
        this.init();
    }
    
    async init() {
        await this.loadLevels();
        this.bindEvents();
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.updateCellSize();
            this.renderCars();
        });
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
        
        // Global pointer events for dragging
        document.addEventListener('pointermove', this.onPointerMove.bind(this));
        document.addEventListener('pointerup', this.onPointerUp.bind(this));
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
                    "grid": 6,
                    "vehicles": [
                        { "id": "main", "type": "main", "orient": "h", "col": 1, "row": 2 },
                        { "id": "c1", "type": "car2", "orient": "v", "col": 3, "row": 1 },
                        { "id": "c2", "type": "car3", "orient": "h", "col": 0, "row": 5 },
                        { "id": "c3", "type": "car3", "orient": "v", "col": 0, "row": 0 }
                    ]
                },
                {
                    "id": 2,
                    "grid": 6,
                    "vehicles": [
                        { "id": "main", "type": "main", "orient": "h", "col": 0, "row": 2 },
                        { "id": "c1", "type": "car3", "orient": "v", "col": 2, "row": 1 },
                        { "id": "c2", "type": "car2", "orient": "h", "col": 3, "row": 2 },
                        { "id": "c3", "type": "car2", "orient": "v", "col": 5, "row": 0 },
                        { "id": "c4", "type": "car2", "orient": "h", "col": 4, "row": 4 }
                    ]
                },
                {
                    "id": 3,
                    "grid": 6,
                    "vehicles": [
                        { "id": "main", "type": "main", "orient": "h", "col": 0, "row": 2 },
                        { "id": "c1", "type": "car2", "orient": "v", "col": 2, "row": 1 },
                        { "id": "c2", "type": "car2", "orient": "v", "col": 3, "row": 2 },
                        { "id": "c3", "type": "car3", "orient": "v", "col": 5, "row": 1 },
                        { "id": "c4", "type": "car3", "orient": "h", "col": 0, "row": 5 },
                        { "id": "c5", "type": "car2", "orient": "h", "col": 4, "row": 4 },
                        { "id": "c6", "type": "car2", "orient": "h", "col": 0, "row": 0 }
                    ]
                }
            ];
        }
    }
    
    startLevel() {
        const levelData = this.levels[this.currentLevelIndex];
        this.levelDisplay.textContent = `LEVEL ${this.currentLevelIndex + 1}`;
        this.moves = 0;
        this.updateMovesDisplay();
        
        this.gridSize = levelData.grid || 6;
        
        // Setup vehicles with logical length
        this.vehicles = JSON.parse(JSON.stringify(levelData.vehicles)).map(v => {
            v.len = (v.type === 'car3') ? 3 : 2;
            return v;
        });
        
        this.updateCellSize();
        this.buildGrid();
        this.renderCars();
    }
    
    updateCellSize() {
        this.cellSize = this.boardEl.clientWidth / this.gridSize;
    }
    
    updateMovesDisplay() {
        this.moveCounterDisplay.textContent = `MOVES: ${this.moves}`;
    }
    
    buildGrid() {
        this.grid = [];
        for(let r=0; r<this.gridSize; r++) {
            this.grid[r] = new Array(this.gridSize).fill(null);
        }
        
        this.vehicles.forEach(v => {
            for(let i=0; i<v.len; i++) {
                if (v.orient === 'h') {
                    this.grid[v.row][v.col + i] = v.id;
                } else {
                    this.grid[v.row + i][v.col] = v.id;
                }
            }
        });
    }
    
    renderCars() {
        this.carsLayer.innerHTML = '';
        
        this.vehicles.forEach(v => {
            const el = document.createElement('div');
            el.className = `car ${v.type} orient-${v.orient}`;
            el.dataset.id = v.id;
            
            // Dimensions
            const gap = 2; // pixel gap
            if (v.orient === 'h') {
                el.style.width = `${this.cellSize * v.len - gap*2}px`;
                el.style.height = `${this.cellSize - gap*2}px`;
            } else {
                el.style.width = `${this.cellSize - gap*2}px`;
                el.style.height = `${this.cellSize * v.len - gap*2}px`;
            }
            
            this.updateCarPosition(el, v.col, v.row);
            
            // Interaction
            el.addEventListener('pointerdown', (e) => this.onPointerDown(e, v, el));
            
            this.carsLayer.appendChild(el);
            v.el = el;
        });
    }
    
    updateCarPosition(el, col, row, transition = false) {
        const gap = 2;
        el.style.transition = transition ? 'left 0.2s, top 0.2s' : 'none';
        el.style.left = `${col * this.cellSize + gap}px`;
        el.style.top = `${row * this.cellSize + gap}px`;
    }
    
    onPointerDown(e, v, el) {
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.isDragging = true;
        this.dragCar = v;
        
        // Prevent default to stop scrolling
        e.preventDefault();
        
        // Temporarily remove car from grid for collision logic
        this.removeCarFromGrid(v);
        
        this.dragStartObj = {
            startX: e.clientX,
            startY: e.clientY,
            startCol: v.col,
            startRow: v.row,
            el: el
        };
        
        el.style.transition = 'none'; // Disable transition for raw drag
        el.style.zIndex = '100';
    }
    
    onPointerMove(e) {
        if (!this.isDragging || !this.dragCar) return;
        
        const v = this.dragCar;
        const dx = e.clientX - this.dragStartObj.startX;
        const dy = e.clientY - this.dragStartObj.startY;
        
        const dCol = dx / this.cellSize;
        const dRow = dy / this.cellSize;
        
        let newCol = this.dragStartObj.startCol;
        let newRow = this.dragStartObj.startRow;
        
        // Restrict bounds and orientation
        if (v.orient === 'h') {
            newCol += dCol;
        } else {
            newRow += dRow;
        }
        
        // Find limits for this car based on current grid state
        const limits = this.getLimits(v);
        
        // Clamp visually
        let clampedCol = Math.max(limits.minCol, Math.min(limits.maxCol, newCol));
        let clampedRow = Math.max(limits.minRow, Math.min(limits.maxRow, newRow));
        
        this.updateCarPosition(v.el, clampedCol, clampedRow);
    }
    
    onPointerUp(e) {
        if (!this.isDragging || !this.dragCar) return;
        
        this.isDragging = false;
        const v = this.dragCar;
        
        const limits = this.getLimits(v);
        
        // Determine final snapped logical position
        const dx = e.clientX - this.dragStartObj.startX;
        const dy = e.clientY - this.dragStartObj.startY;
        
        let targetCol = this.dragStartObj.startCol;
        let targetRow = this.dragStartObj.startRow;
        
        if (v.orient === 'h') {
            targetCol += Math.round(dx / this.cellSize);
            targetCol = Math.max(limits.minCol, Math.min(limits.maxCol, targetCol));
        } else {
            targetRow += Math.round(dy / this.cellSize);
            targetRow = Math.max(limits.minRow, Math.min(limits.maxRow, targetRow));
        }
        
        // Check if actually moved
        if (targetCol !== this.dragStartObj.startCol || targetRow !== this.dragStartObj.startRow) {
            this.moves++;
            this.updateMovesDisplay();
            this.synth.playSlide();
        } else {
            if (Math.abs(dx)>10 || Math.abs(dy)>10) {
                // Tried to move but snapped back
                this.synth.playThud();
            }
        }
        
        // Update state
        v.col = targetCol;
        v.row = targetRow;
        v.el.style.zIndex = '10';
        
        // Snap visually
        this.updateCarPosition(v.el, v.col, v.row, true);
        
        // Re-add to grid
        this.addCarToGrid(v);
        
        // Check Win
        if (v.id === 'main' && v.col === this.gridSize - v.len) {
            // Reached right edge!
            setTimeout(() => this.triggerWin(), 300);
        }
        
        this.dragCar = null;
    }
    
    removeCarFromGrid(v) {
        for(let i=0; i<v.len; i++) {
            if (v.orient === 'h') this.grid[v.row][v.col + i] = null;
            else this.grid[v.row + i][v.col] = null;
        }
    }
    
    addCarToGrid(v) {
        for(let i=0; i<v.len; i++) {
            if (v.orient === 'h') this.grid[v.row][v.col + i] = v.id;
            else this.grid[v.row + i][v.col] = v.id;
        }
    }
    
    getLimits(v) {
        let minCol = v.col;
        let maxCol = v.col;
        let minRow = v.row;
        let maxRow = v.row;
        
        if (v.orient === 'h') {
            // Find max left
            for(let c = v.col - 1; c >= 0; c--) {
                if (this.grid[v.row][c]) break;
                minCol = c;
            }
            // Find max right
            for(let c = v.col + v.len; c < this.gridSize; c++) {
                if (this.grid[v.row][c]) break;
                maxCol = c - v.len + 1;
            }
        } else {
            // Find max up
            for(let r = v.row - 1; r >= 0; r--) {
                if (this.grid[r][v.col]) break;
                minRow = r;
            }
            // Find max down
            for(let r = v.row + v.len; r < this.gridSize; r++) {
                if (this.grid[r][v.col]) break;
                maxRow = r - v.len + 1;
            }
        }
        return { minCol, maxCol, minRow, maxRow };
    }
    
    triggerWin() {
        this.synth.playWin();
        document.getElementById('final-moves').textContent = this.moves;
        this.overlayWin.classList.remove('hidden');
    }
}

window.onload = () => {
    new ParkingJam();
};
