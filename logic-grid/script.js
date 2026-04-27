let puzzleData = null;
let cellStates = {}; // key: "cat1:item1|cat2:item2", value: 0 (empty), 1 (X), 2 (O)
let subGridMaps = []; // Array of { cat1, cat2, rowItems, colItems }

// DOM Elements
const cluesListEl = document.getElementById('clues-list');
const gridEl = document.getElementById('logic-grid');
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');
const hintBtn = document.getElementById('hint-btn');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const closeModalBtn = document.getElementById('close-modal-btn');

// Fetch and init
async function init() {
    setupTheme();
    try {
        const res = await fetch('puzzle.json');
        if (!res.ok) throw new Error("Fetch failed");
        puzzleData = await res.json();
    } catch (e) {
        console.warn("Failed to load puzzle.json. Using fallback data.", e);
        puzzleData = {
            "categories": [
                { "name": "Names", "items": ["Alice", "Bob", "Charlie", "Dave"] },
                { "name": "Pets", "items": ["Dog", "Cat", "Bird", "Fish"] },
                { "name": "Colors", "items": ["Red", "Blue", "Green", "Yellow"] }
            ],
            "clues": [
                "Bob has a Dog.",
                "The person who likes Yellow has a Bird.",
                "Alice likes Red and has a Cat.",
                "Charlie likes Green.",
                "Dave does not have a Fish."
            ],
            "solution": [
                { "Names": "Alice", "Pets": "Cat", "Colors": "Red" },
                { "Names": "Bob", "Pets": "Dog", "Colors": "Blue" },
                { "Names": "Charlie", "Pets": "Fish", "Colors": "Green" },
                { "Names": "Dave", "Pets": "Bird", "Colors": "Yellow" }
            ]
        };
    }
    
    renderClues();
    buildGrid();
    setupEventListeners();
}

// Theme
function setupTheme() {
    const savedTheme = localStorage.getItem('logic-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('logic-theme', newTheme);
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

// UI Setup
function renderClues() {
    cluesListEl.innerHTML = '';
    puzzleData.clues.forEach((clue, idx) => {
        const li = document.createElement('li');
        li.className = 'clue-item';
        li.textContent = clue;
        li.addEventListener('click', () => li.classList.toggle('crossed'));
        cluesListEl.appendChild(li);
    });
}

function buildGrid() {
    gridEl.innerHTML = '';
    const cats = puzzleData.categories;
    // We assume 3 categories for this classic layout
    // Layout:
    // [Blank]            [Top Header C1]   [Top Header C2]
    // [Left Header C0]   [SubGrid C0xC1]   [SubGrid C0xC2]
    // [Left Header C2]   [SubGrid C2xC1]   [Blank]
    
    const cat0 = cats[0]; // Names
    const cat1 = cats[1]; // Pets
    const cat2 = cats[2]; // Colors

    const itemSize = cat0.items.length;

    gridEl.style.gridTemplateColumns = 'auto auto auto';
    gridEl.style.gridTemplateRows = 'auto auto auto';

    // R1
    gridEl.appendChild(createBlank());
    gridEl.appendChild(createTopHeader(cat1));
    gridEl.appendChild(createTopHeader(cat2));

    // R2
    gridEl.appendChild(createSideHeader(cat0));
    gridEl.appendChild(createSubGrid(cat0, cat1));
    gridEl.appendChild(createSubGrid(cat0, cat2));

    // R3
    gridEl.appendChild(createSideHeader(cat2));
    gridEl.appendChild(createSubGrid(cat2, cat1));
    gridEl.appendChild(createBlank());
}

function createBlank() {
    const div = document.createElement('div');
    div.className = 'grid-blank';
    return div;
}

function createTopHeader(category) {
    const container = document.createElement('div');
    container.className = 'grid-header-container';
    
    const label = document.createElement('div');
    label.className = 'header-category-label';
    label.textContent = category.name;
    container.appendChild(label);

    const row = document.createElement('div');
    row.className = 'header-items-row';
    category.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'header-item top-header-item';
        div.textContent = item;
        row.appendChild(div);
    });
    container.appendChild(row);
    return container;
}

function createSideHeader(category) {
    const container = document.createElement('div');
    container.className = 'grid-header-container';
    container.style.flexDirection = 'row'; // side by side

    const labelContainer = document.createElement('div');
    labelContainer.style.display = 'flex';
    labelContainer.style.alignItems = 'center';
    labelContainer.style.justifyContent = 'center';
    labelContainer.style.borderRight = '1px solid var(--border-color)';
    labelContainer.style.backgroundColor = 'var(--secondary-color)';
    labelContainer.style.padding = '5px';
    
    const label = document.createElement('div');
    label.className = 'header-category-label';
    label.style.writingMode = 'vertical-rl';
    label.style.transform = 'rotate(180deg)';
    label.style.borderBottom = 'none';
    label.textContent = category.name;
    labelContainer.appendChild(label);
    
    container.appendChild(labelContainer);

    const col = document.createElement('div');
    col.className = 'header-items-col';
    category.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'header-item side-header-item';
        div.textContent = item;
        col.appendChild(div);
    });
    container.appendChild(col);
    return container;
}

function createSubGrid(rowCat, colCat) {
    const container = document.createElement('div');
    container.className = 'sub-grid';
    const rows = rowCat.items.length;
    const cols = colCat.items.length;
    
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Keep track of subgrid structures for auto-cross logic
    const subGridInfo = {
        rowCat: rowCat.name,
        colCat: colCat.name,
        cells: [] // 2D array of cell DOM elements
    };

    for (let r = 0; r < rows; r++) {
        let rowCells = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            const rowItem = rowCat.items[r];
            const colItem = colCat.items[c];
            // Sort keys alphabetically so A-B is same as B-A if needed, though strictly we have row/col
            const key = `${rowCat.name}:${rowItem}|${colCat.name}:${colItem}`;
            cell.dataset.key = key;
            cellStates[key] = 0;

            cell.addEventListener('click', () => handleCellClick(cell, key, subGridInfo, r, c));
            
            container.appendChild(cell);
            rowCells.push({ cell, key });
        }
        subGridInfo.cells.push(rowCells);
    }
    
    subGridMaps.push(subGridInfo);
    return container;
}

// Interaction Logic
function handleCellClick(cellEl, key, subGridInfo, r, c) {
    let state = cellStates[key];
    // Cycle: 0 -> 1(X) -> 2(O) -> 0
    state = (state + 1) % 3;
    
    setCellState(cellEl, key, state);

    if (state === 2) {
        autoCross(subGridInfo, r, c);
    }
}

function setCellState(cellEl, key, state) {
    cellStates[key] = state;
    cellEl.classList.remove('mark-x', 'mark-o', 'hint-highlight');
    cellEl.textContent = '';
    
    if (state === 1) {
        cellEl.classList.add('mark-x');
        cellEl.textContent = '✕';
    } else if (state === 2) {
        cellEl.classList.add('mark-o');
        cellEl.textContent = '◯';
    }
}

function autoCross(subGridInfo, rowIdx, colIdx) {
    // Cross out row
    for (let c = 0; c < subGridInfo.cells[rowIdx].length; c++) {
        if (c !== colIdx) {
            const { cell, key } = subGridInfo.cells[rowIdx][c];
            if (cellStates[key] === 0) setCellState(cell, key, 1);
        }
    }
    // Cross out col
    for (let r = 0; r < subGridInfo.cells.length; r++) {
        if (r !== rowIdx) {
            const { cell, key } = subGridInfo.cells[r][colIdx];
            if (cellStates[key] === 0) setCellState(cell, key, 1);
        }
    }
}

// Validation & Hint Logic
function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    resetBtn.addEventListener('click', resetGrid);
    checkBtn.addEventListener('click', checkSolution);
    hintBtn.addEventListener('click', giveHint);
    closeModalBtn.addEventListener('click', () => resultModal.classList.add('hidden'));
}

function resetGrid() {
    // Reset all states
    document.querySelectorAll('.grid-cell').forEach(cell => {
        const key = cell.dataset.key;
        setCellState(cell, key, 0);
    });
    // Uncross clues
    document.querySelectorAll('.clue-item').forEach(item => item.classList.remove('crossed'));
}

function buildSolutionMap() {
    // Convert array of objects to required pairs
    const pairs = new Set();
    puzzleData.solution.forEach(obj => {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                const catA = keys[i];
                const itemA = obj[catA];
                const catB = keys[j];
                const itemB = obj[catB];
                // Generate both orders to easily check against cell dataset keys
                pairs.add(`${catA}:${itemA}|${catB}:${itemB}`);
                pairs.add(`${catB}:${itemB}|${catA}:${itemA}`);
            }
        }
    });
    return pairs;
}

function checkSolution() {
    const truePairs = buildSolutionMap();
    let isComplete = true;
    let isCorrect = true;

    // Check every expected pair
    for (const key of truePairs) {
        if (cellStates[key] !== undefined) {
            if (cellStates[key] !== 2) {
                isComplete = false;
            }
        }
    }

    // Check for false positives (user placed O where it shouldn't be)
    for (const key in cellStates) {
        if (cellStates[key] === 2 && !truePairs.has(key)) {
            isCorrect = false;
        }
    }

    if (isComplete && isCorrect) {
        showModal("Congratulations!", "You have solved the puzzle perfectly!", true);
    } else if (!isCorrect) {
        showModal("Incorrect", "There is at least one mistake in your grid.", false);
    } else {
        showModal("Incomplete", "You haven't found all the correct associations yet.", false);
    }
}

function giveHint() {
    const truePairs = buildSolutionMap();
    
    // First, look for a mistake to point out
    for (const key in cellStates) {
        const cellEl = document.querySelector(`.grid-cell[data-key="${key}"]`);
        if (!cellEl) continue;

        if (cellStates[key] === 2 && !truePairs.has(key)) {
            // Found a false positive
            cellEl.classList.add('hint-highlight');
            setTimeout(() => cellEl.classList.remove('hint-highlight'), 3000);
            return;
        }
        if (cellStates[key] === 1 && truePairs.has(key)) {
            // Found a false negative
            cellEl.classList.add('hint-highlight');
            setTimeout(() => cellEl.classList.remove('hint-highlight'), 3000);
            return;
        }
    }

    // If no mistakes, reveal one correct tick
    let keys = Object.keys(cellStates);
    // Shuffle
    keys.sort(() => Math.random() - 0.5);

    for (const key of keys) {
        if (cellStates[key] === 0 && truePairs.has(key)) {
            const cellEl = document.querySelector(`.grid-cell[data-key="${key}"]`);
            
            // Find which subgrid this belongs to
            let sgInfo, rIdx, cIdx;
            subGridMaps.forEach(sg => {
                sg.cells.forEach((row, r) => {
                    row.forEach((col, c) => {
                        if (col.key === key) {
                            sgInfo = sg; rIdx = r; cIdx = c;
                        }
                    });
                });
            });

            setCellState(cellEl, key, 2);
            cellEl.classList.add('hint-highlight');
            setTimeout(() => cellEl.classList.remove('hint-highlight'), 3000);
            if (sgInfo) autoCross(sgInfo, rIdx, cIdx);
            return;
        }
    }

    showModal("No Hints Available", "You've already found everything or made no mistakes so far!", false);
}

function showModal(title, msg, isSuccess) {
    modalTitle.textContent = title;
    modalTitle.style.color = isSuccess ? 'var(--success-color)' : 'var(--danger-color)';
    modalMessage.textContent = msg;
    resultModal.classList.remove('hidden');
}

// Start
init();
