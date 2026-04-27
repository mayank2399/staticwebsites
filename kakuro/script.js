let levels = [];
let currentLevelIndex = 0;
let currentLevel = null;
let gridState = []; // 2D array of user values
let cellEls = [];   // 2D array of DOM elements
let selectedCell = null; // {r, c}

let timer = 0;
let timerInterval = null;
let isGameOver = false;

// DOM Elements
const gridContainer = document.getElementById('kakuro-grid');
const levelSelect = document.getElementById('level-select');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const keys = document.querySelectorAll('.key');
const winModal = document.getElementById('win-modal');
const finalTimeEl = document.getElementById('final-time');
const nextBtn = document.getElementById('next-btn');

// Initialization
async function init() {
    try {
        const res = await fetch('levels.json');
        if (!res.ok) throw new Error("Fetch failed");
        levels = await res.json();
    } catch (e) {
        console.warn("Failed to load levels.json. Using fallback data.", e);
        // Fallback to the hardcoded levels if fetch fails
        levels = [
            {
                "id": 1, "difficulty": "Easy", "size": 4,
                "grid": [
                    [{"type":"empty"}, {"type":"clue","down":4}, {"type":"clue","down":13}, {"type":"empty"}],
                    [{"type":"clue","right":4}, {"type":"value","solution":1}, {"type":"value","solution":3}, {"type":"clue","down":16}],
                    [{"type":"clue","right":14}, {"type":"value","solution":3}, {"type":"value","solution":2}, {"type":"value","solution":9}],
                    [{"type":"empty"}, {"type":"clue","right":15}, {"type":"value","solution":8}, {"type":"value","solution":7}]
                ]
            }
        ];
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
        opt.textContent = `${lvl.difficulty} ${lvl.size}x${lvl.size}`;
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

    nextBtn.addEventListener('click', () => {
        winModal.classList.add('hidden');
        if (currentLevelIndex < levels.length - 1) {
            levelSelect.value = currentLevelIndex + 1;
            loadLevel(currentLevelIndex + 1);
        } else {
            alert("Congratulations! You've beaten all puzzles.");
            loadLevel(0);
            levelSelect.value = 0;
        }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (isGameOver || !selectedCell) return;
        
        if (e.key >= '1' && e.key <= '9') {
            handleInput(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            handleInput(null);
        } else if (e.key === 'ArrowUp') {
            moveSelection(-1, 0);
        } else if (e.key === 'ArrowDown') {
            moveSelection(1, 0);
        } else if (e.key === 'ArrowLeft') {
            moveSelection(0, -1);
        } else if (e.key === 'ArrowRight') {
            moveSelection(0, 1);
        }
    });

    // On-screen keypad
    keys.forEach(key => {
        key.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // Prevent focus loss
            if (isGameOver || !selectedCell) return;
            const val = key.dataset.val;
            if (val === 'clear') {
                handleInput(null);
            } else {
                handleInput(parseInt(val));
            }
        });
    });
    
    // Deselect if clicking outside grid and keypad
    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.grid') && !e.target.closest('.keypad') && !e.target.closest('button')) {
            deselectCell();
        }
    });
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function startTimer() {
    clearInterval(timerInterval);
    timer = 0;
    timerEl.textContent = formatTime(timer);
    timerInterval = setInterval(() => {
        if (!isGameOver) {
            timer++;
            timerEl.textContent = formatTime(timer);
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function loadLevel(index) {
    currentLevelIndex = index;
    currentLevel = levels[index];
    isGameOver = false;
    winModal.classList.add('hidden');
    selectedCell = null;
    
    startTimer();
    renderGrid();
}

function renderGrid() {
    const size = currentLevel.size;
    gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    gridContainer.innerHTML = '';
    
    gridState = Array(size).fill().map(() => Array(size).fill(null));
    cellEls = Array(size).fill().map(() => Array(size).fill(null));

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cellData = currentLevel.grid[r][c];
            const cell = document.createElement('div');
            cell.className = 'cell ' + cellData.type;
            
            if (cellData.type === 'clue') {
                if (cellData.down) {
                    const downSpan = document.createElement('span');
                    downSpan.className = 'clue-down';
                    downSpan.textContent = cellData.down;
                    cell.appendChild(downSpan);
                }
                if (cellData.right) {
                    const rightSpan = document.createElement('span');
                    rightSpan.className = 'clue-right';
                    rightSpan.textContent = cellData.right;
                    cell.appendChild(rightSpan);
                }
            } else if (cellData.type === 'value') {
                cell.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    selectCell(r, c);
                });
            }

            gridContainer.appendChild(cell);
            cellEls[r][c] = cell;
        }
    }
}

function selectCell(r, c) {
    if (isGameOver) return;
    deselectCell();
    selectedCell = {r, c};
    cellEls[r][c].classList.add('selected');
}

function deselectCell() {
    if (selectedCell) {
        cellEls[selectedCell.r][selectedCell.c].classList.remove('selected');
        selectedCell = null;
    }
}

function moveSelection(dr, dc) {
    if (!selectedCell) return;
    const size = currentLevel.size;
    let r = selectedCell.r + dr;
    let c = selectedCell.c + dc;
    
    while (r >= 0 && r < size && c >= 0 && c < size) {
        if (currentLevel.grid[r][c].type === 'value') {
            selectCell(r, c);
            return;
        }
        r += dr;
        c += dc;
    }
}

function handleInput(val) {
    const {r, c} = selectedCell;
    gridState[r][c] = val;
    
    const cellEl = cellEls[r][c];
    cellEl.textContent = val ? val : '';
    
    validateGrid();
    checkWinCondition();
}

// Extract runs and validate
function validateGrid() {
    const size = currentLevel.size;
    
    // Clear all error/solved classes
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (currentLevel.grid[r][c].type === 'value') {
                cellEls[r][c].classList.remove('error', 'solved');
            }
        }
    }

    // Check horizontal runs
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (currentLevel.grid[r][c].type === 'clue' && currentLevel.grid[r][c].right) {
                const targetSum = currentLevel.grid[r][c].right;
                let runCells = [];
                let currC = c + 1;
                while (currC < size && currentLevel.grid[r][currC].type === 'value') {
                    runCells.push({r, c: currC});
                    currC++;
                }
                checkRun(runCells, targetSum);
            }
        }
    }

    // Check vertical runs
    for (let c = 0; c < size; c++) {
        for (let r = 0; r < size; r++) {
            if (currentLevel.grid[r][c].type === 'clue' && currentLevel.grid[r][c].down) {
                const targetSum = currentLevel.grid[r][c].down;
                let runCells = [];
                let currR = r + 1;
                while (currR < size && currentLevel.grid[currR][c].type === 'value') {
                    runCells.push({r: currR, c});
                    currR++;
                }
                checkRun(runCells, targetSum);
            }
        }
    }
}

function checkRun(runCells, targetSum) {
    let sum = 0;
    let isFull = true;
    let vals = [];
    let hasDuplicates = false;

    runCells.forEach(cell => {
        const val = gridState[cell.r][cell.c];
        if (val) {
            sum += val;
            if (vals.includes(val)) hasDuplicates = true;
            vals.push(val);
        } else {
            isFull = false;
        }
    });

    let isError = false;
    if (hasDuplicates) isError = true;
    if (sum > targetSum) isError = true;
    if (isFull && sum !== targetSum) isError = true;

    runCells.forEach(cell => {
        const cellEl = cellEls[cell.r][cell.c];
        if (isError && gridState[cell.r][cell.c]) {
            cellEl.classList.add('error');
        } else if (isFull && !isError) {
            // Can optionally mark run as solved (green text), but we'll stick to error highlighting
            // cellEl.classList.add('solved');
        }
    });
}

function checkWinCondition() {
    const size = currentLevel.size;
    let isWin = true;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (currentLevel.grid[r][c].type === 'value') {
                if (gridState[r][c] !== currentLevel.grid[r][c].solution) {
                    isWin = false;
                    break;
                }
            }
        }
    }

    // Double check that there are no errors just in case
    const hasErrors = document.querySelector('.cell.error') !== null;

    if (isWin && !hasErrors) {
        isGameOver = true;
        stopTimer();
        deselectCell();
        finalTimeEl.textContent = formatTime(timer);
        winModal.classList.remove('hidden');
    }
}

// Start
init();
