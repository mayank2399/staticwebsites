// State
let levels = [];
let currentLevelIndex = StorageManager.loadLevel();
let grid = [];
let totalDots = 0;
let visitedNodes = []; // Array of {r, c}
let isDrawing = false;
let pointerPos = { x: 0, y: 0 };
let gameWon = false;

// Geometry
let canvasWidth, canvasHeight;
let ctx;
let cellSize = 0;
let offsetX = 0, offsetY = 0;
const dotRadius = 12;
const snapDistance = 25;

// DOM
const canvas = document.getElementById('game-canvas');
const levelDisplay = document.getElementById('level-display');
const resetBtn = document.getElementById('reset-btn');
const modal = document.getElementById('success-modal');
const nextBtn = document.getElementById('next-level-btn');

// Initialization
async function init() {
    try {
        const response = await fetch('levels.json');
        levels = await response.json();
        setupLevel();
        setupEvents();
        requestAnimationFrame(render);
    } catch (error) {
        console.error("Failed to load levels", error);
    }
}

function setupLevel() {
    if (currentLevelIndex >= levels.length) {
        currentLevelIndex = 0; // wrap around
    }
    
    StorageManager.saveLevel(currentLevelIndex);
    levelDisplay.textContent = `Level ${currentLevelIndex + 1}`;
    
    grid = levels[currentLevelIndex];
    visitedNodes = [];
    isDrawing = false;
    gameWon = false;
    modal.classList.add('hidden');
    
    // Count total valid dots
    totalDots = 0;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === 1) totalDots++;
        }
    }
    
    resize();
}

function resize() {
    const dim = setupCanvas(canvas);
    canvasWidth = dim.width;
    canvasHeight = dim.height;
    ctx = dim.ctx;
    
    // Calculate layout
    const rows = grid.length;
    const cols = grid[0].length;
    
    // Determine cell size to fit canvas leaving some padding
    const padding = 40;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;
    
    cellSize = Math.min(availableWidth / Math.max(1, cols - 1), availableHeight / Math.max(1, rows - 1));
    
    // Center the grid
    const gridPixelWidth = (cols - 1) * cellSize;
    const gridPixelHeight = (rows - 1) * cellSize;
    
    offsetX = (canvasWidth - gridPixelWidth) / 2;
    offsetY = (canvasHeight - gridPixelHeight) / 2;
}

// Convert grid (r, c) to canvas (x, y)
function getCoord(r, c) {
    return {
        x: offsetX + c * cellSize,
        y: offsetY + r * cellSize
    };
}

// Check if two nodes are adjacent horizontally or vertically
function isAdjacent(node1, node2) {
    const dr = Math.abs(node1.r - node2.r);
    const dc = Math.abs(node1.c - node2.c);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

// Find grid node near given x, y (including invalid 0 points)
function getDotAt(x, y) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const pos = getCoord(r, c);
            if (getDistance(x, y, pos.x, pos.y) <= snapDistance) {
                return { r, c };
            }
        }
    }
    return null;
}

// Input Events
function setupEvents() {
    window.addEventListener('resize', resize);
    
    resetBtn.addEventListener('click', () => {
        visitedNodes = [];
        isDrawing = false;
    });
    
    nextBtn.addEventListener('click', () => {
        currentLevelIndex++;
        setupLevel();
    });
    
    canvas.addEventListener('pointerdown', (e) => {
        if (gameWon) return;
        canvas.setPointerCapture(e.pointerId);
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dot = getDotAt(x, y);
        
        // Start a new path
        if (dot) {
            visitedNodes = [dot];
            isDrawing = true;
            pointerPos = { x, y };
        }
    });
    
    canvas.addEventListener('pointermove', (e) => {
        if (!isDrawing || gameWon) return;
        
        const rect = canvas.getBoundingClientRect();
        pointerPos.x = e.clientX - rect.left;
        pointerPos.y = e.clientY - rect.top;
        
        const dot = getDotAt(pointerPos.x, pointerPos.y);
        if (dot) {
            const lastNode = visitedNodes[visitedNodes.length - 1];
            
            // Check if backtracking
            if (visitedNodes.length > 1) {
                const prevNode = visitedNodes[visitedNodes.length - 2];
                if (dot.r === prevNode.r && dot.c === prevNode.c) {
                    visitedNodes.pop(); // Remove last segment
                    return;
                }
            }
            
            // Try to add new node
            const alreadyVisited = visitedNodes.some(n => n.r === dot.r && n.c === dot.c);
            if (!alreadyVisited && isAdjacent(lastNode, dot)) {
                visitedNodes.push(dot);
                checkWin();
            }
        }
    });
    
    const endDrag = () => {
        if (!isDrawing) return;
        isDrawing = false;
        
        if (!gameWon && visitedNodes.length > 0) {
            // Failed attempt, reset
            visitedNodes = [];
        }
    };
    
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
}

function checkWin() {
    const isPerfectPath = visitedNodes.length === totalDots && visitedNodes.every(n => grid[n.r][n.c] === 1);
    if (isPerfectPath) {
        gameWon = true;
        isDrawing = false;
        setTimeout(() => {
            modal.classList.remove('hidden');
        }, 300);
    }
}

// Rendering
function render() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw connections (faint grid lines to show valid paths)
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)'; // Slate 600 with low opacity
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === 1) {
                const p1 = getCoord(r, c);
                // Draw to right neighbor
                if (c + 1 < grid[r].length && grid[r][c+1] === 1) {
                    const p2 = getCoord(r, c+1);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
                // Draw to bottom neighbor
                if (r + 1 < grid.length && grid[r+1][c] === 1) {
                    const p2 = getCoord(r+1, c);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Draw Path
    if (visitedNodes.length > 0) {
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line').trim() || '#8b5cf6';
        ctx.lineWidth = 10;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        const start = getCoord(visitedNodes[0].r, visitedNodes[0].c);
        ctx.moveTo(start.x, start.y);
        
        for (let i = 1; i < visitedNodes.length; i++) {
            const p = getCoord(visitedNodes[i].r, visitedNodes[i].c);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        
        // Draw dynamic line to pointer
        if (isDrawing) {
            const last = getCoord(visitedNodes[visitedNodes.length - 1].r, visitedNodes[visitedNodes.length - 1].c);
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(pointerPos.x, pointerPos.y);
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'; // slightly transparent
            ctx.stroke();
        }
    }
    
    // Draw Dots
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === 1) {
                const pos = getCoord(r, c);
                const isVisited = visitedNodes.some(n => n.r === r && n.c === c);
                
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
                
                if (isVisited) {
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-dot-active').trim() || '#8b5cf6';
                    // Optional glow
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 10;
                } else {
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-dot').trim() || '#475569';
                    ctx.shadowBlur = 0;
                }
                
                ctx.fill();
                ctx.shadowBlur = 0; // reset
            }
        }
    }
    
    requestAnimationFrame(render);
}

// Start
init();
