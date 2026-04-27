/**
 * Hexa Block Puzzle - Main Game Logic
 */

// Simple synthesizer for game sounds to avoid external assets
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
        this.playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.15, 0.1), 50);
    }

    playError() {
        this.playTone(150, 'sawtooth', 0.2, 0.1);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.25, 0.1), 100);
    }

    playLevelUp() {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.2, 0.05), i * 100);
        });
    }
}

// Hexagon math utilities (Pointy topped)
const HexMath = {
    // Convert axial (q, r) to pixel (x, y)
    axialToPixel: (q, r, size) => {
        const x = size * Math.sqrt(3) * (q + r / 2);
        const y = size * 3 / 2 * r;
        return { x, y };
    },
    
    // Convert pixel to axial (q, r)
    pixelToAxial: (x, y, size) => {
        const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
        const r = (2 / 3 * y) / size;
        return HexMath.axialRound(q, r);
    },

    axialRound: (q, r) => {
        let s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const qDiff = Math.abs(rq - q);
        const rDiff = Math.abs(rr - r);
        const sDiff = Math.abs(rs - s);

        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        } else {
            rs = -rq - rr;
        }
        return { q: rq, r: rr };
    },

    // Get the points for a polygon SVG
    getHexPolygon: (size) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            points.push(`${size * Math.cos(angle_rad)},${size * Math.sin(angle_rad)}`);
        }
        return points.join(' ');
    }
};

class HexGame {
    constructor() {
        this.levels = [];
        this.currentLevelIndex = 0;
        this.boardSize = 30; // Pixel size of grid hexagons
        this.traySize = 18;  // Pixel size of tray hexagons
        
        this.gridState = new Map(); // 'q,r' -> pieceId or null
        this.pieces = [];
        this.activePiece = null;
        
        this.synth = new AudioSynth();
        
        this.svgBoard = document.getElementById('board-svg');
        this.trayContainer = document.getElementById('tray-container');
        this.levelDisplay = document.getElementById('level-display');
        this.btnReset = document.getElementById('btn-reset');
        this.btnNext = document.getElementById('btn-next-level');
        this.modal = document.getElementById('modal-overlay');

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadLevels();
        this.loadLevel(this.currentLevelIndex);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.levels.length > 0) {
                this.renderBoard();
                this.returnAllPiecesToTray();
            }
        });
    }

    bindEvents() {
        this.btnReset.addEventListener('click', () => {
            this.returnAllPiecesToTray();
        });

        this.btnNext.addEventListener('click', () => {
            this.modal.classList.add('hidden');
            this.currentLevelIndex++;
            if (this.currentLevelIndex >= this.levels.length) {
                this.currentLevelIndex = 0; // Loop back
            }
            this.loadLevel(this.currentLevelIndex);
        });

        // Global drag events
        document.addEventListener('pointermove', this.handleDrag.bind(this), {passive: false});
        document.addEventListener('pointerup', this.handleDrop.bind(this));
        document.addEventListener('pointercancel', this.handleDrop.bind(this));
    }

    async loadLevels() {
        try {
            const response = await fetch('levels/levels.json');
            this.levels = await response.json();
        } catch (e) {
            console.error('Failed to load levels', e);
            // Fallback levels
            this.levels = [
                {
                    id: 1,
                    grid: [{q:0, r:0}, {q:1, r:-1}, {q:1, r:0}],
                    pieces: [
                        {color: '#ef4444', shape: [{q:0, r:0}, {q:1, r:-1}, {q:1, r:0}]}
                    ]
                }
            ];
        }
    }

    loadLevel(index) {
        const level = this.levels[index];
        this.levelDisplay.textContent = level.id;
        this.gridState.clear();
        
        // Initialize grid state
        level.grid.forEach(cell => {
            this.gridState.set(`${cell.q},${cell.r}`, null); // null means empty
        });

        this.renderBoard();
        this.renderTray();
    }

    renderBoard() {
        this.svgBoard.innerHTML = '';
        const level = this.levels[this.currentLevelIndex];
        
        // Calculate bounding box to center the board
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        level.grid.forEach(cell => {
            const {x, y} = HexMath.axialToPixel(cell.q, cell.r, this.boardSize);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        });

        const width = maxX - minX + this.boardSize * 4;
        const height = maxY - minY + this.boardSize * 4;
        
        // Set viewBox to center the grid
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        this.svgBoard.setAttribute('viewBox', `${cx - width/2} ${cy - height/2} ${width} ${height}`);

        // Draw grid cells
        const polygonPoints = HexMath.getHexPolygon(this.boardSize);
        level.grid.forEach(cell => {
            const {x, y} = HexMath.axialToPixel(cell.q, cell.r, this.boardSize);
            const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            hex.setAttribute('points', polygonPoints);
            hex.setAttribute('transform', `translate(${x}, ${y})`);
            hex.setAttribute('class', 'hex-grid-cell');
            hex.id = `grid-${cell.q}-${cell.r}`;
            this.svgBoard.appendChild(hex);
        });
    }

    renderTray() {
        // Cleanup old elements
        this.pieces.forEach(p => p.element.remove());
        this.trayContainer.innerHTML = '';
        this.pieces = [];
        
        const level = this.levels[this.currentLevelIndex];

        level.pieces.forEach((pieceData, index) => {
            this.createPiece(pieceData, index);
        });
    }

    createPiece(pieceData, index) {
        // Create SVG for the piece
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'piece-group');
        svg.style.overflow = 'visible';
        
        // Shift shape so that the first block is at 0,0 locally
        const qOffset = pieceData.shape[0].q;
        const rOffset = pieceData.shape[0].r;
        
        const normalizedShape = pieceData.shape.map(cell => ({
            q: cell.q - qOffset,
            r: cell.r - rOffset
        }));

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const polygonPoints = HexMath.getHexPolygon(this.boardSize);
        
        normalizedShape.forEach(cell => {
            const {x, y} = HexMath.axialToPixel(cell.q, cell.r, this.boardSize);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            
            const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            hex.setAttribute('points', polygonPoints);
            hex.setAttribute('transform', `translate(${x}, ${y})`);
            hex.setAttribute('class', 'piece-hex');
            hex.setAttribute('fill', pieceData.color);
            svg.appendChild(hex);
        });

        // Dimensions of the piece
        const pWidth = maxX - minX + this.boardSize * 2.2;
        const pHeight = maxY - minY + this.boardSize * 2.2;
        
        // We set fixed width/height based on boardSize, but scale it down in tray
        svg.setAttribute('width', pWidth);
        svg.setAttribute('height', pHeight);
        
        // The viewBox centers the piece properly
        svg.setAttribute('viewBox', `${minX - this.boardSize * 1.1} ${minY - this.boardSize * 1.1} ${pWidth} ${pHeight}`);
        
        // Center offset relative to first hex (0,0)
        // Since viewBox starts at minX..., the 0,0 point is at (-minX + boardSize*1.1, -minY + boardSize*1.1) in local SV coordinates
        const originX = -minX + this.boardSize * 1.1;
        const originY = -minY + this.boardSize * 1.1;
        
        // Create wrapper for the tray
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = `${pWidth * (this.traySize / this.boardSize)}px`;
        wrapper.style.height = `${pHeight * (this.traySize / this.boardSize)}px`;
        
        this.trayContainer.appendChild(wrapper);
        
        const pieceObj = {
            id: `piece-${index}`,
            element: svg,
            wrapper: wrapper,
            shape: normalizedShape,
            color: pieceData.color,
            isSnapped: false,
            snappedTo: null,
            baseScale: this.traySize / this.boardSize,
            origin: {x: originX, y: originY}
        };
        
        this.pieces.push(pieceObj);
        
        // Append to body to allow free dragging over everything
        document.body.appendChild(svg); 
        this.resetPiecePosition(pieceObj);

        // Bind events
        svg.addEventListener('pointerdown', (e) => this.startDrag(e, pieceObj));
    }

    resetPiecePosition(piece) {
        const rect = piece.wrapper.getBoundingClientRect();
        // Position fixed to the body over its wrapper
        piece.element.style.left = `${rect.left}px`;
        piece.element.style.top = `${rect.top}px`;
        piece.element.style.setProperty('--x', '0px');
        piece.element.style.setProperty('--y', '0px');
        piece.element.style.setProperty('--scale', piece.baseScale);
        piece.element.classList.remove('snapped');
        piece.element.classList.remove('dragging');
        piece.isSnapped = false;
        piece.element.style.display = 'block'; // Ensure visible
        
        // Remove from grid state if it was snapped
        if (piece.snappedTo) {
            piece.shape.forEach(cell => {
                const q = piece.snappedTo.q + cell.q;
                const r = piece.snappedTo.r + cell.r;
                this.gridState.set(`${q},${r}`, null);
            });
            piece.snappedTo = null;
        }
    }

    returnAllPiecesToTray() {
        this.pieces.forEach(p => this.resetPiecePosition(p));
        this.updateBoardColors();
    }

    startDrag(e, piece) {
        if (e.button !== undefined && e.button !== 0) return; // Only left click
        e.preventDefault();
        
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();

        this.activePiece = piece;
        
        if (piece.isSnapped) {
            piece.shape.forEach(cell => {
                const q = piece.snappedTo.q + cell.q;
                const r = piece.snappedTo.r + cell.r;
                this.gridState.set(`${q},${r}`, null);
            });
            piece.isSnapped = false;
            piece.snappedTo = null;
            this.updateBoardColors();
        }

        piece.element.style.display = 'block';
        piece.element.classList.add('dragging');
        piece.element.classList.remove('snapped');
        
        piece.element.style.setProperty('--scale', '1');

        const rect = piece.element.getBoundingClientRect();
        
        // We want the piece to center slightly above the finger/mouse
        const targetCenterX = e.clientX;
        const targetCenterY = e.clientY - 40; // Offset up for visibility
        
        // Current position of element's top-left
        const elLeft = parseFloat(piece.element.style.left) || 0;
        const elTop = parseFloat(piece.element.style.top) || 0;
        
        // We calculate the X/Y translation needed
        // When scale is 1, the element is at its full width/height
        const fullWidth = piece.element.getAttribute('width');
        const fullHeight = piece.element.getAttribute('height');
        
        const newTransX = targetCenterX - elLeft - fullWidth/2;
        const newTransY = targetCenterY - elTop - fullHeight/2;
        
        piece.element.style.setProperty('--x', `${newTransX}px`);
        piece.element.style.setProperty('--y', `${newTransY}px`);

        // dragOffset is the difference between pointer and center
        this.dragOffsetX = e.clientX - targetCenterX;
        this.dragOffsetY = e.clientY - targetCenterY;
        
        this.pieces.forEach(p => p.element.style.zIndex = '10');
        piece.element.style.zIndex = '100';
    }

    handleDrag(e) {
        if (!this.activePiece) return;
        e.preventDefault();

        const piece = this.activePiece;
        const elLeft = parseFloat(piece.element.style.left) || 0;
        const elTop = parseFloat(piece.element.style.top) || 0;
        const fullWidth = piece.element.getAttribute('width');
        const fullHeight = piece.element.getAttribute('height');

        const targetCenterX = e.clientX - this.dragOffsetX;
        const targetCenterY = e.clientY - this.dragOffsetY;

        const x = targetCenterX - elLeft - fullWidth/2;
        const y = targetCenterY - elTop - fullHeight/2;

        piece.element.style.setProperty('--x', `${x}px`);
        piece.element.style.setProperty('--y', `${y}px`);
    }

    handleDrop(e) {
        if (!this.activePiece) return;
        
        const piece = this.activePiece;
        this.activePiece = null;
        piece.element.classList.remove('dragging');

        // Find the absolute position of the 0,0 hexagon of the piece
        const rect = piece.element.getBoundingClientRect();
        
        // origin point in local pixels
        const originLocalX = piece.origin.x;
        const originLocalY = piece.origin.y;
        
        // Scale is 1, so local maps to screen relative to rect left/top
        // Except SVG scaling... the element width is set to pWidth, and viewBox covers it exactly.
        const scaleX = rect.width / piece.element.getAttribute('width');
        const scaleY = rect.height / piece.element.getAttribute('height');
        
        const firstHexCenterX = rect.left + originLocalX * scaleX;
        const firstHexCenterY = rect.top + originLocalY * scaleY;

        const ctm = this.svgBoard.getScreenCTM();
        if (!ctm) {
            this.resetPiecePosition(piece);
            return;
        }
        
        const pt = this.svgBoard.createSVGPoint();
        pt.x = firstHexCenterX;
        pt.y = firstHexCenterY;
        const svgP = pt.matrixTransform(ctm.inverse());

        const axial = HexMath.pixelToAxial(svgP.x, svgP.y, this.boardSize);
        
        if (this.canSnap(piece, axial.q, axial.r)) {
            this.snapPiece(piece, axial.q, axial.r);
        } else {
            this.synth.playError();
            this.resetPiecePosition(piece);
        }
    }

    canSnap(piece, q, r) {
        for (let cell of piece.shape) {
            const targetQ = q + cell.q;
            const targetR = r + cell.r;
            const key = `${targetQ},${targetR}`;
            
            if (!this.gridState.has(key)) return false; 
            if (this.gridState.get(key) !== null) return false; 
        }
        return true;
    }

    snapPiece(piece, q, r) {
        piece.isSnapped = true;
        piece.snappedTo = {q, r};
        
        piece.shape.forEach(cell => {
            const targetQ = q + cell.q;
            const targetR = r + cell.r;
            this.gridState.set(`${targetQ},${targetR}`, piece.id);
        });

        this.updateBoardColors();

        // Hide piece as grid is now colored
        piece.element.style.display = 'none';
        
        this.synth.playPlace();
        this.checkWinCondition();
    }

    updateBoardColors() {
        for (let [key, val] of this.gridState.entries()) {
            const elId = `grid-${key.replace(',', '-')}`;
            const el = document.getElementById(elId);
            if (el) {
                if (val === null) {
                    el.style.fill = 'var(--cell-empty)';
                    el.classList.remove('filled');
                } else {
                    const piece = this.pieces.find(p => p.id === val);
                    if (piece) {
                        el.style.fill = piece.color;
                        el.classList.add('filled');
                    }
                }
            }
        }
        
        this.pieces.forEach(p => {
            if (!p.isSnapped) {
                p.element.style.display = 'block';
            }
        });
    }

    checkWinCondition() {
        let isWin = true;
        for (let val of this.gridState.values()) {
            if (val === null) {
                isWin = false;
                break;
            }
        }

        if (isWin) {
            setTimeout(() => {
                this.synth.playLevelUp();
                this.modal.classList.remove('hidden');
            }, 300);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HexGame();
});
