/**
 * Block Puzzle Jewel Game Logic
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

    playPlace() {
        this.playTone(300, 'triangle', 0.1, 0.2);
    }

    playClear(lines) {
        // Higher pitch for more lines
        const baseFreq = 400 + (lines * 100);
        this.playTone(baseFreq, 'square', 0.3, 0.1);
        setTimeout(() => this.playTone(baseFreq * 1.5, 'square', 0.4, 0.1), 100);
    }

    playCombo(comboCount) {
        const freq = 500 + (comboCount * 150);
        this.playTone(freq, 'sine', 0.5, 0.2);
        setTimeout(() => this.playTone(freq * 1.25, 'sine', 0.5, 0.2), 150);
    }
    
    playGameOver() {
        this.playTone(200, 'sawtooth', 0.3, 0.2);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.2), 200);
    }
}

// Predefined shapes (1 means block, 0 means empty)
const SHAPES = [
    // 1x1
    [[1]],
    // 2x2
    [[1,1],[1,1]],
    // 3x3
    [[1,1,1],[1,1,1],[1,1,1]],
    // Horizontal lines
    [[1,1]], [[1,1,1]], [[1,1,1,1]], [[1,1,1,1,1]],
    // Vertical lines
    [[1],[1]], [[1],[1],[1]], [[1],[1],[1],[1]], [[1],[1],[1],[1],[1]],
    // L shapes (2x2)
    [[1,1],[1,0]], [[1,1],[0,1]], [[1,0],[1,1]], [[0,1],[1,1]],
    // L shapes (3x3)
    [[1,1,1],[1,0,0],[1,0,0]], [[1,1,1],[0,0,1],[0,0,1]], [[1,0,0],[1,0,0],[1,1,1]], [[0,0,1],[0,0,1],[1,1,1]],
    // T shapes
    [[1,1,1],[0,1,0]], [[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[0,1],[1,1],[0,1]],
    // Cross
    [[0,1,0],[1,1,1],[0,1,0]]
];

class BlockPuzzleGame {
    constructor() {
        this.gridSize = 10;
        this.board = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill(null));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('blockPuzzleBest')) || 0;
        this.combo = 0;
        
        this.synth = new AudioSynth();
        
        // DOM Elements
        this.gridEl = document.getElementById('grid');
        this.traySlots = Array.from({length: 3}, (_, i) => {
            const slot = document.createElement('div');
            slot.className = 'tray-slot';
            slot.id = `tray-slot-${i}`;
            document.getElementById('tray-container').appendChild(slot);
            return slot;
        });
        
        this.scoreEl = document.getElementById('score');
        this.bestScoreEl = document.getElementById('best-score');
        this.comboEl = document.getElementById('combo-display');
        
        this.activePiece = null;
        this.trayPieces = [null, null, null];
        
        this.cellSize = 32; // Default, will update based on screen size
        
        this.init();
    }

    init() {
        this.updateScoreDisplay();
        this.createGrid();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        document.addEventListener('pointermove', this.handleDrag.bind(this), {passive: false});
        document.addEventListener('pointerup', this.handleDrop.bind(this));
        document.addEventListener('pointercancel', this.handleDrop.bind(this));
        
        document.getElementById('btn-restart').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
            this.resetGame();
        });

        this.spawnPieces();
    }

    handleResize() {
        const boardContainer = document.getElementById('board-container');
        const availableWidth = Math.min(window.innerWidth - 32, 450 - 32); // Padding and max-width
        // Calculate cell size: width - borders(4px) - padding(8px) - 9*gap(2px)
        const innerWidth = availableWidth - 12; 
        this.cellSize = Math.floor((innerWidth - (this.gridSize - 1) * 2) / this.gridSize);
        
        document.documentElement.style.setProperty('--cell-size', `${this.cellSize}px`);
    }

    createGrid() {
        this.gridEl.innerHTML = '';
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.id = `cell-${r}-${c}`;
                this.gridEl.appendChild(cell);
            }
        }
    }

    resetGame() {
        this.board = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill(null));
        this.score = 0;
        this.combo = 0;
        this.updateScoreDisplay();
        
        // Clear DOM grid
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                cell.innerHTML = '';
                cell.className = 'cell';
            }
        }
        
        this.spawnPieces();
    }

    updateScoreDisplay() {
        this.scoreEl.textContent = this.score;
        this.bestScoreEl.textContent = this.bestScore;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreEl.textContent = this.bestScore;
            localStorage.setItem('blockPuzzleBest', this.bestScore);
        }
    }

    showCombo(count) {
        if (count < 2) return;
        this.comboEl.textContent = `${count}x COMBO!`;
        this.comboEl.classList.add('show');
        setTimeout(() => this.comboEl.classList.remove('show'), 1500);
    }

    getRandomShape() {
        return SHAPES[Math.floor(Math.random() * SHAPES.length)];
    }

    getRandomColor() {
        return `color-${Math.floor(Math.random() * 7)}`;
    }

    spawnPieces() {
        // Clear any leftover pieces
        this.traySlots.forEach(slot => slot.innerHTML = '');

        let allEmpty = true;
        for (let i = 0; i < 3; i++) {
            if (this.trayPieces[i] === null) {
                const shape = this.getRandomShape();
                const color = this.getRandomColor();
                this.createPieceElement(i, shape, color);
            } else {
                allEmpty = false;
            }
        }
        
        // If all 3 slots were populated, check game over
        setTimeout(() => this.checkGameOver(), 100);
    }

    createPieceElement(index, shape, color) {
        const slot = this.traySlots[index];
        slot.innerHTML = ''; // Clear existing
        
        const rows = shape.length;
        const cols = shape[0].length;
        
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        pieceEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        // Render blocks
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const block = document.createElement('div');
                    block.className = `block ${color}`;
                    // Grid placement
                    block.style.gridRow = `${r + 1}`;
                    block.style.gridColumn = `${c + 1}`;
                    pieceEl.appendChild(block);
                }
            }
        }
        
        slot.appendChild(pieceEl);
        
        const pieceObj = {
            id: `piece-${Date.now()}-${index}`,
            index: index,
            element: pieceEl,
            shape: shape,
            color: color,
            rows: rows,
            cols: cols
        };
        
        this.trayPieces[index] = pieceObj;
        
        pieceEl.addEventListener('pointerdown', (e) => this.startDrag(e, pieceObj));
    }

    startDrag(e, piece) {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        
        this.activePiece = piece;
        
        const el = piece.element;
        el.classList.add('dragging');
        
        // Pop to scale 1 (match grid size)
        el.style.setProperty('--scale', '1');
        
        const rect = el.getBoundingClientRect();
        
        // Center the piece slightly above the pointer
        // Full width of piece at scale 1 is cols * (cellSize + gap)
        const fullWidth = piece.cols * (this.cellSize + 2); 
        const fullHeight = piece.rows * (this.cellSize + 2);
        
        const targetX = e.clientX;
        const targetY = e.clientY - 60; // Offset up
        
        // Calculate translation relative to its original tray slot
        const slotRect = this.traySlots[piece.index].getBoundingClientRect();
        
        // Initialize x,y css vars
        this.dragOffsetX = e.clientX - targetX;
        this.dragOffsetY = e.clientY - targetY;
        
        // Transform origin is center, so top left is targetX - fullWidth/2
        const tx = targetX - slotRect.left - slotRect.width/2;
        const ty = targetY - slotRect.top - slotRect.height/2;
        
        el.style.transform = `translate(${tx}px, ${ty}px) scale(1)`;
        
        // Save initial pos for dragging
        this.startX = slotRect.left + slotRect.width/2;
        this.startY = slotRect.top + slotRect.height/2;
        
        document.body.appendChild(el); // Move to body for free dragging over everything
        
        // Set transform manually since it's on body now
        el.style.left = `${this.startX}px`;
        el.style.top = `${this.startY}px`;
        el.style.margin = `-${fullHeight/2}px 0 0 -${fullWidth/2}px`; // Center on left/top
        
        this.handleDrag(e);
    }

    handleDrag(e) {
        if (!this.activePiece) return;
        e.preventDefault();
        
        const targetX = e.clientX - this.dragOffsetX;
        const targetY = e.clientY - this.dragOffsetY;
        
        const tx = targetX - this.startX;
        const ty = targetY - this.startY;
        
        this.activePiece.element.style.transform = `translate(${tx}px, ${ty}px) scale(1)`;
        
        this.updateShadowDrop(targetX, targetY);
    }

    updateShadowDrop(centerX, centerY) {
        // Clear old shadows
        document.querySelectorAll('.cell.shadow-drop').forEach(c => c.classList.remove('shadow-drop'));
        
        const gridPos = this.getGridPositionFromPointer(centerX, centerY);
        if (gridPos && this.canPlace(this.activePiece.shape, gridPos.r, gridPos.c)) {
            // Draw shadow
            const shape = this.activePiece.shape;
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[0].length; c++) {
                    if (shape[r][c]) {
                        const cell = document.getElementById(`cell-${gridPos.r + r}-${gridPos.c + c}`);
                        if (cell) cell.classList.add('shadow-drop');
                    }
                }
            }
        }
    }

    getGridPositionFromPointer(px, py) {
        // px, py is the center of the piece.
        // We need the top-left of the piece to align with a grid cell.
        const piece = this.activePiece;
        const fullWidth = piece.cols * (this.cellSize + 2);
        const fullHeight = piece.rows * (this.cellSize + 2);
        
        const topLeftX = px - fullWidth / 2;
        const topLeftY = py - fullHeight / 2;
        
        // Find grid cell closest to topLeftX, topLeftY
        const gridRect = this.gridEl.getBoundingClientRect();
        
        // Check if pointer is somewhat over the board
        if (px < gridRect.left - 50 || px > gridRect.right + 50 || 
            py < gridRect.top - 50 || py > gridRect.bottom + 50) {
            return null;
        }
        
        const relativeX = topLeftX - gridRect.left;
        const relativeY = topLeftY - gridRect.top;
        
        const col = Math.round(relativeX / (this.cellSize + 2));
        const row = Math.round(relativeY / (this.cellSize + 2));
        
        return { r: row, c: col };
    }

    handleDrop(e) {
        if (!this.activePiece) return;
        
        const piece = this.activePiece;
        this.activePiece = null;
        
        // Clear shadow
        document.querySelectorAll('.cell.shadow-drop').forEach(c => c.classList.remove('shadow-drop'));
        
        const targetX = e.clientX - this.dragOffsetX;
        const targetY = e.clientY - this.dragOffsetY;
        
        const gridPos = this.getGridPositionFromPointer(targetX, targetY);
        
        if (gridPos && this.canPlace(piece.shape, gridPos.r, gridPos.c)) {
            // Place it!
            this.placePiece(piece, gridPos.r, gridPos.c);
            piece.element.remove();
            this.trayPieces[piece.index] = null;
            
            // Check if tray is empty
            if (this.trayPieces.every(p => p === null)) {
                this.spawnPieces();
            } else {
                this.checkGameOver();
            }
        } else {
            // Return to tray
            this.synth.playTone(150, 'sawtooth', 0.1, 0.1);
            const slot = this.traySlots[piece.index];
            slot.appendChild(piece.element);
            
            // Reset styles
            piece.element.classList.remove('dragging');
            piece.element.style.left = '';
            piece.element.style.top = '';
            piece.element.style.margin = '';
            piece.element.style.transform = '';
            piece.element.style.setProperty('--scale', '0.6');
        }
    }

    canPlace(shape, startR, startC) {
        const rows = shape.length;
        const cols = shape[0].length;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const boardR = startR + r;
                    const boardC = startC + c;
                    
                    // Out of bounds
                    if (boardR < 0 || boardR >= this.gridSize || boardC < 0 || boardC >= this.gridSize) {
                        return false;
                    }
                    
                    // Overlap
                    if (this.board[boardR][boardC] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece(piece, startR, startC) {
        const shape = piece.shape;
        let blocksPlaced = 0;
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c]) {
                    const boardR = startR + r;
                    const boardC = startC + c;
                    
                    this.board[boardR][boardC] = piece.color;
                    
                    const cell = document.getElementById(`cell-${boardR}-${boardC}`);
                    cell.innerHTML = `<div class="block ${piece.color}"></div>`;
                    
                    blocksPlaced++;
                }
            }
        }
        
        // Base score for placing
        this.score += blocksPlaced;
        this.updateScoreDisplay();
        this.synth.playPlace();
        
        // Check for lines
        this.checkLines();
    }

    checkLines() {
        const rowsToClear = [];
        const colsToClear = [];
        
        // Check rows
        for (let r = 0; r < this.gridSize; r++) {
            if (this.board[r].every(cell => cell !== null)) {
                rowsToClear.push(r);
            }
        }
        
        // Check cols
        for (let c = 0; c < this.gridSize; c++) {
            let isFull = true;
            for (let r = 0; r < this.gridSize; r++) {
                if (this.board[r][c] === null) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) colsToClear.push(c);
        }
        
        const totalLines = rowsToClear.length + colsToClear.length;
        
        if (totalLines > 0) {
            this.combo++;
            
            // Score calculation
            // Base: 10 per line.
            // Combo multiplier.
            // Multiple lines bonus.
            let points = totalLines * 10 * this.combo;
            if (totalLines > 1) points += totalLines * 5; 
            
            this.score += points;
            this.updateScoreDisplay();
            
            if (this.combo > 1) {
                this.showCombo(this.combo);
                this.synth.playCombo(this.combo);
            } else {
                this.synth.playClear(totalLines);
            }
            
            // Perform clear animation and update state
            const cellsToAnimate = new Set();
            
            rowsToClear.forEach(r => {
                for (let c = 0; c < this.gridSize; c++) {
                    cellsToAnimate.add(`${r},${c}`);
                }
            });
            
            colsToClear.forEach(c => {
                for (let r = 0; r < this.gridSize; r++) {
                    cellsToAnimate.add(`${r},${c}`);
                }
            });
            
            cellsToAnimate.forEach(coord => {
                const [r, c] = coord.split(',').map(Number);
                this.board[r][c] = null;
                const cell = document.getElementById(`cell-${r}-${c}`);
                cell.classList.add('clearing');
            });
            
            // Clean up DOM after animation
            setTimeout(() => {
                cellsToAnimate.forEach(coord => {
                    const [r, c] = coord.split(',').map(Number);
                    const cell = document.getElementById(`cell-${r}-${c}`);
                    cell.innerHTML = '';
                    cell.classList.remove('clearing');
                });
                this.checkGameOver(); // Recheck after board space frees up
            }, 300);
            
        } else {
            this.combo = 0; // Reset combo if no lines cleared
        }
    }

    checkGameOver() {
        // Can any of the pieces in the tray be placed?
        let canPlaceAny = false;
        
        for (let i = 0; i < 3; i++) {
            const piece = this.trayPieces[i];
            if (piece) {
                // Try every position on the board
                for (let r = 0; r < this.gridSize; r++) {
                    for (let c = 0; c < this.gridSize; c++) {
                        if (this.canPlace(piece.shape, r, c)) {
                            canPlaceAny = true;
                            break;
                        }
                    }
                    if (canPlaceAny) break;
                }
            }
            if (canPlaceAny) break;
        }
        
        if (!canPlaceAny && this.trayPieces.some(p => p !== null)) {
            // Delay slightly to let animations finish
            setTimeout(() => {
                this.synth.playGameOver();
                document.getElementById('final-score').textContent = this.score;
                document.getElementById('modal-overlay').classList.remove('hidden');
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BlockPuzzleGame();
});
