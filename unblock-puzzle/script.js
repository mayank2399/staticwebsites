// Global State
let levels = [];
let currentLevelIndex = 0;
let currentLevel = null;
let boardMatrix = [];
let blocks = [];
let moveHistory = [];
let moves = 0;
let bestScores = JSON.parse(localStorage.getItem('unblock-best-scores') || '{}');

// DOM Elements
const boardEl = document.getElementById('board');
const levelSelect = document.getElementById('level-select');
const moveCountEl = document.getElementById('move-count');
const bestScoreEl = document.getElementById('best-score');
const undoBtn = document.getElementById('undo-btn');
const restartBtn = document.getElementById('restart-btn');
const winModal = document.getElementById('win-modal');
const finalMovesEl = document.getElementById('final-moves');
const nextLevelBtn = document.getElementById('next-level-btn');

// Drag State
let isDragging = false;
let dragBlock = null;
let startX = 0, startY = 0;
let initialTranslateX = 0, initialTranslateY = 0;
let minPixel = 0, maxPixel = 0;
let cellSize = 0;

// Fallback levels in case local fetch fails (CORS issue on local file://)
const fallbackLevels = [
    {
        "id": 1, "gridSize": 6, "exitRow": 2,
        "blocks": [
            { "id": "b1", "type": "main", "orientation": "horizontal", "length": 2, "row": 2, "col": 0 },
            { "id": "b2", "type": "normal", "orientation": "vertical", "length": 3, "row": 0, "col": 2 },
            { "id": "b3", "type": "normal", "orientation": "vertical", "length": 2, "row": 4, "col": 0 },
            { "id": "b4", "type": "normal", "orientation": "horizontal", "length": 2, "row": 4, "col": 1 },
            { "id": "b5", "type": "normal", "orientation": "vertical", "length": 3, "row": 3, "col": 3 },
            { "id": "b6", "type": "normal", "orientation": "horizontal", "length": 2, "row": 5, "col": 4 },
            { "id": "b7", "type": "normal", "orientation": "vertical", "length": 2, "row": 0, "col": 5 }
        ]
    },
    {
        "id": 2, "gridSize": 6, "exitRow": 2,
        "blocks": [
            { "id": "b1", "type": "main", "orientation": "horizontal", "length": 2, "row": 2, "col": 1 },
            { "id": "b2", "type": "normal", "orientation": "vertical", "length": 2, "row": 0, "col": 1 },
            { "id": "b3", "type": "normal", "orientation": "horizontal", "length": 2, "row": 0, "col": 2 },
            { "id": "b4", "type": "normal", "orientation": "vertical", "length": 3, "row": 1, "col": 4 },
            { "id": "b5", "type": "normal", "orientation": "vertical", "length": 2, "row": 1, "col": 5 },
            { "id": "b6", "type": "normal", "orientation": "vertical", "length": 2, "row": 3, "col": 2 },
            { "id": "b7", "type": "normal", "orientation": "horizontal", "length": 2, "row": 4, "col": 3 },
            { "id": "b8", "type": "normal", "orientation": "vertical", "length": 2, "row": 4, "col": 5 },
            { "id": "b9", "type": "normal", "orientation": "horizontal", "length": 3, "row": 5, "col": 0 }
        ]
    },
    {
        "id": 3, "gridSize": 6, "exitRow": 2,
        "blocks": [
            { "id": "b1", "type": "main", "orientation": "horizontal", "length": 2, "row": 2, "col": 0 },
            { "id": "b2", "type": "normal", "orientation": "vertical", "length": 3, "row": 0, "col": 2 },
            { "id": "b3", "type": "normal", "orientation": "horizontal", "length": 2, "row": 0, "col": 3 },
            { "id": "b4", "type": "normal", "orientation": "vertical", "length": 3, "row": 1, "col": 5 },
            { "id": "b5", "type": "normal", "orientation": "vertical", "length": 2, "row": 4, "col": 0 },
            { "id": "b6", "type": "normal", "orientation": "horizontal", "length": 2, "row": 3, "col": 3 },
            { "id": "b7", "type": "normal", "orientation": "vertical", "length": 2, "row": 4, "col": 3 },
            { "id": "b8", "type": "normal", "orientation": "horizontal", "length": 2, "row": 5, "col": 4 }
        ]
    }
];

// Initialization
async function init() {
    try {
        const res = await fetch('level.json');
        if (!res.ok) throw new Error("Fetch failed");
        levels = await res.json();
    } catch (e) {
        console.warn("Failed to load level.json, using fallback levels.", e);
        levels = fallbackLevels;
    }

    populateLevelSelector();
    setupEventListeners();
    loadLevel(0);
}

function populateLevelSelector() {
    levelSelect.innerHTML = '';
    levels.forEach((lvl, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `Level ${lvl.id}`;
        levelSelect.appendChild(opt);
    });
}

function setupEventListeners() {
    levelSelect.addEventListener('change', (e) => {
        loadLevel(parseInt(e.target.value));
    });

    restartBtn.addEventListener('click', () => {
        loadLevel(currentLevelIndex);
    });

    undoBtn.addEventListener('click', undoMove);

    nextLevelBtn.addEventListener('click', () => {
        winModal.classList.add('hidden');
        if (currentLevelIndex < levels.length - 1) {
            levelSelect.value = currentLevelIndex + 1;
            loadLevel(currentLevelIndex + 1);
        } else {
            alert("Congratulations! You've beaten all levels.");
            loadLevel(0);
            levelSelect.value = 0;
        }
    });

    // Handle Resize
    window.addEventListener('resize', renderBlocks);
}

function loadLevel(index) {
    currentLevelIndex = index;
    // Deep clone blocks so we can mutate them
    currentLevel = JSON.parse(JSON.stringify(levels[index]));
    blocks = currentLevel.blocks;
    
    moves = 0;
    moveHistory = [];
    updateUI();
    
    // Clear board DOM
    const markers = boardEl.querySelectorAll('.exit-marker');
    boardEl.innerHTML = '';
    markers.forEach(m => boardEl.appendChild(m)); // Keep exit marker
    
    // Create DOM for blocks
    blocks.forEach(b => {
        const div = document.createElement('div');
        div.id = b.id;
        div.className = `block block-${b.type}`;
        
        // Pointer events for dragging
        div.addEventListener('pointerdown', (e) => startDrag(e, b, div));
        
        boardEl.appendChild(div);
        b.el = div;
    });

    updateMatrix();
    renderBlocks();
}

function updateUI() {
    moveCountEl.textContent = moves;
    const best = bestScores[currentLevel.id];
    bestScoreEl.textContent = best ? best : '-';
    undoBtn.disabled = moveHistory.length === 0;
}

function updateMatrix() {
    const size = currentLevel.gridSize;
    boardMatrix = Array(size).fill().map(() => Array(size).fill(null));
    
    blocks.forEach(b => {
        for (let i = 0; i < b.length; i++) {
            if (b.orientation === 'horizontal') {
                boardMatrix[b.row][b.col + i] = b.id;
            } else {
                boardMatrix[b.row + i][b.col] = b.id;
            }
        }
    });
}

function renderBlocks() {
    cellSize = boardEl.clientWidth / currentLevel.gridSize;
    const padding = 2; // small visual gap

    blocks.forEach(b => {
        const x = b.col * cellSize;
        const y = b.row * cellSize;
        const w = b.orientation === 'horizontal' ? b.length * cellSize : cellSize;
        const h = b.orientation === 'vertical' ? b.length * cellSize : cellSize;
        
        b.el.style.width = `${w - padding * 2}px`;
        b.el.style.height = `${h - padding * 2}px`;
        b.el.style.transform = `translate(${x + padding}px, ${y + padding}px)`;
        
        // Store computed values for dragging
        b.currX = x + padding;
        b.currY = y + padding;
    });
}

// Dragging Logic
function startDrag(e, block, el) {
    if (e.button !== 0 && e.type !== 'touchstart') return; // Left click or touch only
    e.preventDefault();

    isDragging = true;
    dragBlock = block;
    el.classList.add('dragging');

    startX = e.clientX || e.touches[0].clientX;
    startY = e.clientY || e.touches[0].clientY;
    initialTranslateX = block.currX;
    initialTranslateY = block.currY;

    calculateBounds(block);

    document.addEventListener('pointermove', onDrag);
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);
}

function calculateBounds(block) {
    const size = currentLevel.gridSize;
    const padding = 2;
    
    if (block.orientation === 'horizontal') {
        // Find min col
        let minCol = block.col;
        while (minCol > 0 && boardMatrix[block.row][minCol - 1] === null) {
            minCol--;
        }
        // Find max col
        let maxCol = block.col;
        while (maxCol + block.length < size && boardMatrix[block.row][maxCol + block.length] === null) {
            maxCol++;
        }
        
        minPixel = minCol * cellSize + padding;
        maxPixel = maxCol * cellSize + padding;
        
        // If main block, allow dragging out the exit
        if (block.type === 'main' && maxCol + block.length === size) {
            maxPixel += cellSize; // allow moving partially out
        }
    } else {
        // Find min row
        let minRow = block.row;
        while (minRow > 0 && boardMatrix[minRow - 1][block.col] === null) {
            minRow--;
        }
        // Find max row
        let maxRow = block.row;
        while (maxRow + block.length < size && boardMatrix[maxRow + block.length][block.col] === null) {
            maxRow++;
        }
        
        minPixel = minRow * cellSize + padding;
        maxPixel = maxRow * cellSize + padding;
    }
}

function onDrag(e) {
    if (!isDragging) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (dragBlock.orientation === 'horizontal') {
        let newX = initialTranslateX + dx;
        newX = Math.max(minPixel, Math.min(newX, maxPixel));
        dragBlock.el.style.transform = `translate(${newX}px, ${dragBlock.currY}px)`;
    } else {
        let newY = initialTranslateY + dy;
        newY = Math.max(minPixel, Math.min(newY, maxPixel));
        dragBlock.el.style.transform = `translate(${dragBlock.currX}px, ${newY}px)`;
    }
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;

    document.removeEventListener('pointermove', onDrag);
    document.removeEventListener('pointerup', endDrag);
    document.removeEventListener('pointercancel', endDrag);

    dragBlock.el.classList.remove('dragging');

    // Get transform
    const transform = dragBlock.el.style.transform;
    const match = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
    
    if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        
        const oldRow = dragBlock.row;
        const oldCol = dragBlock.col;

        if (dragBlock.orientation === 'horizontal') {
            // Snap to grid
            const padding = 2;
            const targetCol = Math.round((x - padding) / cellSize);
            dragBlock.col = targetCol;
        } else {
            const padding = 2;
            const targetRow = Math.round((y - padding) / cellSize);
            dragBlock.row = targetRow;
        }

        // Snap visual
        renderBlocks();
        updateMatrix();

        if (oldRow !== dragBlock.row || oldCol !== dragBlock.col) {
            moveHistory.push({
                blockId: dragBlock.id,
                oldRow, oldCol,
                newRow: dragBlock.row, newCol: dragBlock.col
            });
            moves++;
            updateUI();
            checkWinCondition();
        }
    }
    dragBlock = null;
}

function undoMove() {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory.pop();
    const block = blocks.find(b => b.id === lastMove.blockId);
    
    block.row = lastMove.oldRow;
    block.col = lastMove.oldCol;
    
    moves--;
    updateMatrix();
    renderBlocks();
    updateUI();
}

function checkWinCondition() {
    const mainBlock = blocks.find(b => b.type === 'main');
    const size = currentLevel.gridSize;
    
    // Win if main block's right edge is at the grid boundary (or beyond due to drag out)
    if (mainBlock.col + mainBlock.length >= size) {
        // Save best score
        const best = bestScores[currentLevel.id];
        if (!best || moves < best) {
            bestScores[currentLevel.id] = moves;
            localStorage.setItem('unblock-best-scores', JSON.stringify(bestScores));
        }
        
        finalMovesEl.textContent = moves;
        winModal.classList.remove('hidden');
    }
}

// Start
init();
