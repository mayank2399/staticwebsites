// Game State
let size = 10;
let targetGrid = [];
let userGrid = []; // 0: empty, 1: filled, 2: marked X
let rowHints = [];
let colHints = [];
let mistakes = 0;
const MAX_MISTAKES = 3;
let timer = 0;
let timerInterval = null;
let isGameOver = false;

// DOM Elements
const gridEl = document.getElementById('grid');
const rowHintsEl = document.getElementById('row-hints');
const colHintsEl = document.getElementById('col-hints');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');
const difficultySelect = document.getElementById('difficulty-select');
const newGameBtn = document.getElementById('new-game-btn');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');
const actionToggle = document.getElementById('action-toggle');
const modal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalBtn = document.getElementById('modal-new-game-btn');

// Initialization
function init() {
    setupTheme();
    loadState();
    setupEventListeners();
}

function setupTheme() {
    const savedTheme = localStorage.getItem('nonogram-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('nonogram-theme', newTheme);
    updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
    if (theme === 'dark') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    } else {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }
}

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    difficultySelect.addEventListener('change', (e) => {
        size = parseInt(e.target.value);
        startNewGame();
    });
    newGameBtn.addEventListener('click', startNewGame);
    restartBtn.addEventListener('click', restartCurrentGame);
    modalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        startNewGame();
    });
    
    // Prevent context menu on game container
    document.getElementById('game-container').addEventListener('contextmenu', e => e.preventDefault());
}

function startNewGame() {
    generatePuzzle();
    resetGameState();
    render();
    startTimer();
    saveState();
}

function restartCurrentGame() {
    resetGameState();
    render();
    startTimer();
    saveState();
}

function resetGameState() {
    userGrid = Array(size).fill().map(() => Array(size).fill(0));
    mistakes = 0;
    timer = 0;
    isGameOver = false;
    modal.classList.add('hidden');
    updateStatusUI();
}

function generatePuzzle() {
    targetGrid = Array(size).fill().map(() => Array(size).fill(0));
    // Fill with approx 60% density
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            targetGrid[r][c] = Math.random() > 0.4 ? 1 : 0;
        }
    }
    
    // Ensure at least one filled cell in every row and column
    for (let r = 0; r < size; r++) {
        if (!targetGrid[r].includes(1)) {
            targetGrid[r][Math.floor(Math.random() * size)] = 1;
        }
    }
    for (let c = 0; c < size; c++) {
        let hasOne = false;
        for (let r = 0; r < size; r++) {
            if (targetGrid[r][c] === 1) hasOne = true;
        }
        if (!hasOne) {
            targetGrid[Math.floor(Math.random() * size)][c] = 1;
        }
    }

    calculateHints();
}

function calculateHints() {
    rowHints = [];
    for (let r = 0; r < size; r++) {
        let hints = [];
        let count = 0;
        for (let c = 0; c < size; c++) {
            if (targetGrid[r][c] === 1) {
                count++;
            } else if (count > 0) {
                hints.push(count);
                count = 0;
            }
        }
        if (count > 0) hints.push(count);
        if (hints.length === 0) hints.push(0);
        rowHints.push(hints);
    }

    colHints = [];
    for (let c = 0; c < size; c++) {
        let hints = [];
        let count = 0;
        for (let r = 0; r < size; r++) {
            if (targetGrid[r][c] === 1) {
                count++;
            } else if (count > 0) {
                hints.push(count);
                count = 0;
            }
        }
        if (count > 0) hints.push(count);
        if (hints.length === 0) hints.push(0);
        colHints.push(hints);
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isGameOver) {
            timer++;
            timerEl.textContent = formatTime(timer);
            if (timer % 5 === 0) saveState(); // Save periodically
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function updateStatusUI() {
    timerEl.textContent = formatTime(timer);
    mistakesEl.textContent = `${mistakes} / ${MAX_MISTAKES}`;
}

function render() {
    // Setup CSS Grid sizes based on puzzle size
    document.documentElement.style.setProperty('--grid-size', size);
    
    // Calculate max hints length for grid sizing
    const maxRowHints = Math.max(...rowHints.map(h => h.length));
    const maxColHints = Math.max(...colHints.map(h => h.length));

    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    
    colHintsEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    colHintsEl.style.gridTemplateRows = `1fr`;
    
    rowHintsEl.style.gridTemplateColumns = `1fr`;
    rowHintsEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    // Render Column Hints
    colHintsEl.innerHTML = '';
    for (let c = 0; c < size; c++) {
        const div = document.createElement('div');
        div.className = 'col-hint-container hint-cell';
        if ((c + 1) % 5 === 0 && c !== size - 1) div.classList.add('border-right');
        
        colHints[c].forEach(num => {
            const span = document.createElement('span');
            span.className = 'hint-num';
            span.textContent = num;
            div.appendChild(span);
        });
        colHintsEl.appendChild(div);
    }

    // Render Row Hints
    rowHintsEl.innerHTML = '';
    for (let r = 0; r < size; r++) {
        const div = document.createElement('div');
        div.className = 'row-hint-container hint-cell';
        if ((r + 1) % 5 === 0 && r !== size - 1) div.classList.add('border-bottom');

        rowHints[r].forEach(num => {
            const span = document.createElement('span');
            span.className = 'hint-num';
            span.textContent = num;
            div.appendChild(span);
        });
        rowHintsEl.appendChild(div);
    }

    // Render Grid
    gridEl.innerHTML = '';
    let isDragging = false;
    let dragMode = null; // 'fill' or 'mark' or 'clear'

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            // Add thick borders every 5 cells
            if ((c + 1) % 5 === 0 && c !== size - 1) cell.classList.add('border-right');
            if ((r + 1) % 5 === 0 && r !== size - 1) cell.classList.add('border-bottom');

            updateCellVisuals(cell, r, c);

            // Desktop Events
            cell.addEventListener('mousedown', (e) => {
                if (isGameOver) return;
                isDragging = true;
                
                const isRightClick = e.button === 2;
                const isMarkMode = actionToggle.checked;
                
                if (isRightClick || isMarkMode) {
                    dragMode = userGrid[r][c] === 2 ? 'clear' : 'mark';
                    handleCellInteraction(r, c, dragMode, cell);
                } else {
                    if (userGrid[r][c] !== 1) {
                        dragMode = 'fill';
                        handleCellInteraction(r, c, dragMode, cell);
                    }
                }
            });

            cell.addEventListener('mouseenter', () => {
                if (!isDragging || isGameOver) return;
                handleCellInteraction(r, c, dragMode, cell);
            });

            // Mobile Touch Events (simple tap)
            cell.addEventListener('touchstart', (e) => {
                if (isGameOver) return;
                e.preventDefault(); // Prevent scroll
                const isMarkMode = actionToggle.checked;
                const mode = isMarkMode ? (userGrid[r][c] === 2 ? 'clear' : 'mark') : 'fill';
                handleCellInteraction(r, c, mode, cell);
            });

            gridEl.appendChild(cell);
        }
    }

    document.addEventListener('mouseup', () => {
        isDragging = false;
        dragMode = null;
    });

    updateStatusUI();
    checkHintsCompletion();
}

function updateCellVisuals(cell, r, c) {
    cell.classList.remove('filled', 'marked', 'error');
    if (userGrid[r][c] === 1) cell.classList.add('filled');
    else if (userGrid[r][c] === 2) cell.classList.add('marked');
}

function handleCellInteraction(r, c, mode, cellEl) {
    if (userGrid[r][c] === 1) return; // Already filled correctly

    if (mode === 'fill') {
        if (targetGrid[r][c] === 1) {
            userGrid[r][c] = 1;
            updateCellVisuals(cellEl, r, c);
            checkWin();
        } else {
            // Mistake
            if (userGrid[r][c] !== 2) {
                userGrid[r][c] = 2; // Auto mark X
                mistakes++;
                updateStatusUI();
                cellEl.classList.add('error');
                setTimeout(() => updateCellVisuals(cellEl, r, c), 400);
                
                if (mistakes >= MAX_MISTAKES) {
                    gameOver(false);
                }
            }
        }
    } else if (mode === 'mark') {
        if (userGrid[r][c] !== 1) {
            userGrid[r][c] = 2;
            updateCellVisuals(cellEl, r, c);
        }
    } else if (mode === 'clear') {
        if (userGrid[r][c] === 2) {
            userGrid[r][c] = 0;
            updateCellVisuals(cellEl, r, c);
        }
    }
    
    checkHintsCompletion();
    saveState();
}

// Fade out completed hints
function checkHintsCompletion() {
    // Row hints
    for (let r = 0; r < size; r++) {
        let currentSegments = [];
        let count = 0;
        for (let c = 0; c < size; c++) {
            if (userGrid[r][c] === 1) {
                count++;
            } else if (count > 0) {
                currentSegments.push(count);
                count = 0;
            }
        }
        if (count > 0) currentSegments.push(count);
        if (currentSegments.length === 0) currentSegments.push(0);

        const isComplete = JSON.stringify(currentSegments) === JSON.stringify(rowHints[r]);
        const hintDiv = rowHintsEl.children[r];
        if (isComplete && rowHints[r][0] !== 0) {
            hintDiv.style.opacity = '0.3';
        } else {
            hintDiv.style.opacity = '1';
        }
    }

    // Col hints
    for (let c = 0; c < size; c++) {
        let currentSegments = [];
        let count = 0;
        for (let r = 0; r < size; r++) {
            if (userGrid[r][c] === 1) {
                count++;
            } else if (count > 0) {
                currentSegments.push(count);
                count = 0;
            }
        }
        if (count > 0) currentSegments.push(count);
        if (currentSegments.length === 0) currentSegments.push(0);

        const isComplete = JSON.stringify(currentSegments) === JSON.stringify(colHints[c]);
        const hintDiv = colHintsEl.children[c];
        if (isComplete && colHints[c][0] !== 0) {
            hintDiv.style.opacity = '0.3';
        } else {
            hintDiv.style.opacity = '1';
        }
    }
}

function checkWin() {
    let win = true;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (targetGrid[r][c] === 1 && userGrid[r][c] !== 1) {
                win = false;
                break;
            }
        }
    }
    if (win) {
        gameOver(true);
    }
}

function gameOver(isWin) {
    isGameOver = true;
    stopTimer();
    
    modal.classList.remove('hidden');
    if (isWin) {
        modal.classList.add('win');
        modalTitle.textContent = 'Puzzle Solved!';
        modalMessage.textContent = `You finished the puzzle in ${formatTime(timer)} with ${mistakes} mistakes.`;
        modalBtn.textContent = 'Play Again';
        
        // Clear saved game on win
        localStorage.removeItem('nonogram-save');
    } else {
        modal.classList.remove('win');
        modalTitle.textContent = 'Game Over';
        modalMessage.textContent = 'You made too many mistakes.';
        modalBtn.textContent = 'Try Again';
    }
}

function saveState() {
    if (isGameOver) return;
    const state = {
        size,
        targetGrid,
        userGrid,
        rowHints,
        colHints,
        mistakes,
        timer
    };
    localStorage.setItem('nonogram-save', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('nonogram-save');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            size = state.size;
            targetGrid = state.targetGrid;
            userGrid = state.userGrid;
            rowHints = state.rowHints;
            colHints = state.colHints;
            mistakes = state.mistakes;
            timer = state.timer;
            
            difficultySelect.value = size;
            render();
            startTimer();
            return;
        } catch (e) {
            console.error('Failed to load state', e);
        }
    }
    // If no save or load failed
    difficultySelect.value = size;
    startNewGame();
}

// Start
init();
