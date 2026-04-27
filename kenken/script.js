// Global State
let size = 6;
let solutionGrid = []; // The generated latin square
let userGrid = [];     // What the user has entered
let cages = [];        // Array of cage objects { id, cells, op, target }
let cellCages = [];    // 2D array mapping (r,c) to cage object
let selectedCell = null; // {r, c}
let timer = 0;
let timerInterval = null;
let isGameOver = false;

// DOM Elements
const gridContainer = document.getElementById('kenken-grid');
const sizeSelect = document.getElementById('size-select');
const checkBtn = document.getElementById('check-btn');
const hintBtn = document.getElementById('hint-btn');
const resetBtn = document.getElementById('reset-btn');
const keypad = document.getElementById('keypad');
const timerEl = document.getElementById('timer');
const winModal = document.getElementById('win-modal');
const finalTimeEl = document.getElementById('final-time');
const nextBtn = document.getElementById('next-btn');

// --- PUZZLE GENERATOR ---

// Backtracking to generate Latin Square
function generateLatinSquare(n) {
    let grid = Array(n).fill().map(() => Array(n).fill(0));
    
    // To add randomness, shuffle the numbers to try
    function getShuffledNumbers() {
        let nums = Array.from({length: n}, (_, i) => i + 1);
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        return nums;
    }

    function isSafe(grid, r, c, num) {
        for (let i = 0; i < n; i++) {
            if (grid[r][i] === num || grid[i][c] === num) return false;
        }
        return true;
    }

    function solve() {
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (grid[r][c] === 0) {
                    const nums = getShuffledNumbers();
                    for (let num of nums) {
                        if (isSafe(grid, r, c, num)) {
                            grid[r][c] = num;
                            if (solve()) return true;
                            grid[r][c] = 0;
                        }
                    }
                    return false; // Backtrack
                }
            }
        }
        return true;
    }

    solve();
    return grid;
}

// Partition grid into cages
function generateCages(n) {
    let visited = Array(n).fill().map(() => Array(n).fill(false));
    let localCages = [];
    let cageId = 0;

    const dirs = [[0,1], [1,0], [0,-1], [-1,0]];

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (!visited[r][c]) {
                let targetSize = Math.floor(Math.random() * 3) + 2; // size 2 to 4
                if (Math.random() < 0.1) targetSize = 1; // 10% chance for size 1
                
                let cageCells = [{r, c}];
                visited[r][c] = true;

                // Random walk to form cage
                for (let i = 1; i < targetSize; i++) {
                    // find available adjacent cells
                    let adj = [];
                    for (let cell of cageCells) {
                        for (let [dr, dc] of dirs) {
                            let nr = cell.r + dr, nc = cell.c + dc;
                            if (nr>=0 && nr<n && nc>=0 && nc<n && !visited[nr][nc]) {
                                adj.push({r: nr, c: nc});
                            }
                        }
                    }
                    if (adj.length === 0) break;
                    
                    let nextCell = adj[Math.floor(Math.random() * adj.length)];
                    visited[nextCell.r][nextCell.c] = true;
                    cageCells.push(nextCell);
                }

                localCages.push({ id: cageId++, cells: cageCells });
            }
        }
    }
    return localCages;
}

// Assign operations and calculate targets
function assignOperations(n, localCages, grid) {
    localCages.forEach(cage => {
        let vals = cage.cells.map(c => grid[c.r][c.c]);
        
        if (cage.cells.length === 1) {
            cage.op = '';
            cage.target = vals[0];
        } else if (cage.cells.length === 2) {
            let ops = ['+', '*', '-', '/'];
            let validOps = [];
            
            validOps.push({op: '+', target: vals[0] + vals[1]});
            validOps.push({op: '*', target: vals[0] * vals[1]});
            
            let max = Math.max(vals[0], vals[1]);
            let min = Math.min(vals[0], vals[1]);
            
            if (max - min > 0) validOps.push({op: '-', target: max - min});
            if (max % min === 0) validOps.push({op: '/', target: max / min});
            
            let selected = validOps[Math.floor(Math.random() * validOps.length)];
            cage.op = selected.op;
            cage.target = selected.target;
        } else {
            // size > 2: only + or *
            let ops = [];
            let sum = vals.reduce((a,b) => a+b, 0);
            let prod = vals.reduce((a,b) => a*b, 1);
            ops.push({op: '+', target: sum});
            if (prod <= 200) ops.push({op: '*', target: prod}); // Avoid huge numbers
            
            let selected = ops[Math.floor(Math.random() * ops.length)];
            cage.op = selected.op;
            cage.target = selected.target;
        }

        // Find top-leftmost cell to display the label
        let topLeft = cage.cells[0];
        for (let i = 1; i < cage.cells.length; i++) {
            let c = cage.cells[i];
            if (c.r < topLeft.r || (c.r === topLeft.r && c.c < topLeft.c)) {
                topLeft = c;
            }
        }
        cage.labelCell = topLeft;
    });
}

// --- INITIALIZATION ---

function init() {
    setupEventListeners();
    startNewGame();
}

function startNewGame() {
    isGameOver = false;
    winModal.classList.add('hidden');
    selectedCell = null;
    
    solutionGrid = generateLatinSquare(size);
    cages = generateCages(size);
    assignOperations(size, cages, solutionGrid);
    
    userGrid = Array(size).fill().map(() => Array(size).fill(0));
    cellCages = Array(size).fill().map(() => Array(size).fill(null));
    
    cages.forEach(cage => {
        cage.cells.forEach(c => {
            cellCages[c.r][c.c] = cage;
        });
    });

    renderKeypad();
    renderGrid();
    startTimer();
}

function setupEventListeners() {
    sizeSelect.addEventListener('change', (e) => {
        size = parseInt(e.target.value);
        startNewGame();
    });

    resetBtn.addEventListener('click', () => {
        userGrid = Array(size).fill().map(() => Array(size).fill(0));
        isGameOver = false;
        renderGrid(); // Clears inputs
        startTimer();
    });

    checkBtn.addEventListener('click', () => {
        if (isGameOver) return;
        validateSolution(true); // show errors
    });

    hintBtn.addEventListener('click', () => {
        if (isGameOver) return;
        giveHint();
    });

    nextBtn.addEventListener('click', startNewGame);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (isGameOver || !selectedCell) return;
        
        let key = parseInt(e.key);
        if (key >= 1 && key <= size) {
            handleInput(key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            handleInput(0);
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

    // Deselect if clicking outside
    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.grid') && !e.target.closest('.keypad') && !e.target.closest('button') && !e.target.closest('select')) {
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

// --- UI RENDERING ---

function renderKeypad() {
    keypad.innerHTML = '';
    // Let's use 5 columns max
    let cols = Math.min(size + 1, 5);
    keypad.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    for (let i = 1; i <= size; i++) {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.textContent = i;
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (selectedCell) handleInput(i);
        });
        keypad.appendChild(btn);
    }
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'key action-key';
    clearBtn.textContent = 'C';
    clearBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (selectedCell) handleInput(0);
    });
    keypad.appendChild(clearBtn);
}

function renderGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    gridContainer.innerHTML = '';

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            // Set Cage Borders
            const currentCage = cellCages[r][c];
            
            // Top neighbor
            if (r === 0 || cellCages[r-1][c] !== currentCage) {
                cell.style.borderTop = '3px solid var(--cage-border)';
            }
            // Bottom neighbor
            if (r === size - 1 || cellCages[r+1][c] !== currentCage) {
                cell.style.borderBottom = '3px solid var(--cage-border)';
            }
            // Left neighbor
            if (c === 0 || cellCages[r][c-1] !== currentCage) {
                cell.style.borderLeft = '3px solid var(--cage-border)';
            }
            // Right neighbor
            if (c === size - 1 || cellCages[r][c+1] !== currentCage) {
                cell.style.borderRight = '3px solid var(--cage-border)';
            }

            // Cage Label
            if (currentCage.labelCell.r === r && currentCage.labelCell.c === c) {
                const label = document.createElement('div');
                label.className = 'cage-label';
                // replace division sign for UI
                let opUI = currentCage.op === '/' ? '÷' : (currentCage.op === '*' ? '×' : currentCage.op);
                label.textContent = `${currentCage.target}${opUI}`;
                cell.appendChild(label);
            }

            // Value span (so we don't overwrite label)
            const valSpan = document.createElement('span');
            valSpan.className = 'val-span';
            valSpan.textContent = userGrid[r][c] !== 0 ? userGrid[r][c] : '';
            cell.appendChild(valSpan);

            cell.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                selectCell(r, c);
            });

            gridContainer.appendChild(cell);
        }
    }
}

function updateCellDOM(r, c) {
    const idx = r * size + c;
    const cell = gridContainer.children[idx];
    const valSpan = cell.querySelector('.val-span');
    valSpan.textContent = userGrid[r][c] !== 0 ? userGrid[r][c] : '';
    
    // Clear errors when updating
    cell.classList.remove('error-duplicate', 'error-cage');
}

function getCellDOM(r, c) {
    return gridContainer.children[r * size + c];
}

// --- INTERACTION ---

function selectCell(r, c) {
    if (isGameOver) return;
    deselectCell();
    selectedCell = {r, c};
    getCellDOM(r, c).classList.add('selected');
}

function deselectCell() {
    if (selectedCell) {
        getCellDOM(selectedCell.r, selectedCell.c).classList.remove('selected');
        selectedCell = null;
    }
}

function moveSelection(dr, dc) {
    if (!selectedCell) return;
    let r = selectedCell.r + dr;
    let c = selectedCell.c + dc;
    
    if (r >= 0 && r < size && c >= 0 && c < size) {
        selectCell(r, c);
    }
}

function handleInput(val) {
    const {r, c} = selectedCell;
    userGrid[r][c] = val;
    getCellDOM(r, c).classList.remove('hint'); // clear hint style if user types
    updateCellDOM(r, c);
    
    validateDuplicates();
}

function giveHint() {
    // Find an empty cell or an incorrect cell
    let target = null;
    
    // First look for incorrect
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
            if(userGrid[r][c] !== 0 && userGrid[r][c] !== solutionGrid[r][c]) {
                target = {r, c};
                break;
            }
        }
        if(target) break;
    }

    // If none incorrect, find first empty
    if(!target) {
        let empties = [];
        for(let r=0; r<size; r++) {
            for(let c=0; c<size; c++) {
                if(userGrid[r][c] === 0) empties.push({r,c});
            }
        }
        if(empties.length > 0) {
            target = empties[Math.floor(Math.random() * empties.length)];
        }
    }

    if(target) {
        userGrid[target.r][target.c] = solutionGrid[target.r][target.c];
        updateCellDOM(target.r, target.c);
        let dom = getCellDOM(target.r, target.c);
        dom.classList.add('hint');
        validateDuplicates();
    }
}

// --- VALIDATION ---

function validateDuplicates() {
    let hasError = false;

    // Clear previous
    for (let i = 0; i < size * size; i++) {
        gridContainer.children[i].classList.remove('error-duplicate');
    }

    // Row check
    for (let r = 0; r < size; r++) {
        let seen = new Map();
        for (let c = 0; c < size; c++) {
            let val = userGrid[r][c];
            if (val !== 0) {
                if (seen.has(val)) {
                    hasError = true;
                    getCellDOM(r, c).classList.add('error-duplicate');
                    getCellDOM(r, seen.get(val)).classList.add('error-duplicate');
                } else {
                    seen.set(val, c);
                }
            }
        }
    }

    // Col check
    for (let c = 0; c < size; c++) {
        let seen = new Map();
        for (let r = 0; r < size; r++) {
            let val = userGrid[r][c];
            if (val !== 0) {
                if (seen.has(val)) {
                    hasError = true;
                    getCellDOM(r, c).classList.add('error-duplicate');
                    getCellDOM(seen.get(val), c).classList.add('error-duplicate');
                } else {
                    seen.set(val, r);
                }
            }
        }
    }
    
    return hasError;
}

function validateSolution(showErrors) {
    let isFull = true;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (userGrid[r][c] === 0) isFull = false;
        }
    }

    let hasDupes = validateDuplicates();
    let hasCageError = false;

    cages.forEach(cage => {
        let vals = cage.cells.map(c => userGrid[c.r][c.c]);
        // Only validate if cage is completely filled
        if (vals.includes(0)) return;

        let result = false;
        if (cage.cells.length === 1) {
            result = (vals[0] === cage.target);
        } else if (cage.cells.length === 2) {
            if (cage.op === '+') result = (vals[0] + vals[1] === cage.target);
            if (cage.op === '*') result = (vals[0] * vals[1] === cage.target);
            if (cage.op === '-') result = (Math.abs(vals[0] - vals[1]) === cage.target);
            if (cage.op === '/') result = ((vals[0] / vals[1] === cage.target) || (vals[1] / vals[0] === cage.target));
        } else {
            if (cage.op === '+') result = (vals.reduce((a,b)=>a+b,0) === cage.target);
            if (cage.op === '*') result = (vals.reduce((a,b)=>a*b,1) === cage.target);
        }

        if (!result) {
            hasCageError = true;
            if (showErrors) {
                cage.cells.forEach(c => {
                    getCellDOM(c.r, c.c).classList.add('error-cage');
                });
            }
        }
    });

    if (isFull && !hasDupes && !hasCageError) {
        // Win!
        isGameOver = true;
        clearInterval(timerInterval);
        deselectCell();
        finalTimeEl.textContent = formatTime(timer);
        winModal.classList.remove('hidden');
    } else if (showErrors && !hasCageError && !hasDupes && !isFull) {
        // Just empty
    }
}

// Start
init();
