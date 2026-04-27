/**
 * Triple Tile Match Game Logic
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
    playClick() {
        this.playTone(600, 'sine', 0.05, 0.1);
    }
    playMatch() {
        [500, 600, 750].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.1, 0.1), i * 80));
    }
    playShuffle() {
        for(let i=0; i<5; i++) {
            setTimeout(() => this.playTone(300 + Math.random()*200, 'triangle', 0.05, 0.1), i * 40);
        }
    }
    playUndo() {
        this.playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(300, 'sine', 0.1, 0.1), 100);
    }
    playGameOver() {
        this.playTone(200, 'sawtooth', 0.3, 0.2);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.2), 200);
    }
    playLevelUp() {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.15, 0.05), i * 100));
    }
}

const EMOJIS = ['🍎','🍌','🍇','🍉','🍓','🍒','🍑','🍍','🥝','🥑','🍔','🍕','🍩','🍦','🍭'];

class TripleTileGame {
    constructor() {
        this.synth = new AudioSynth();
        
        this.boardEl = document.getElementById('board-container');
        this.trayEl = document.getElementById('tray');
        this.traySlots = document.querySelectorAll('.tray-slot');
        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level-display');
        this.modal = document.getElementById('modal-overlay');
        
        this.levels = [];
        this.currentLevelIndex = 0;
        this.score = 0;
        
        this.tiles = []; // All tile objects
        this.trayTiles = []; // Tiles currently in tray
        this.moveHistory = []; // For undo
        
        this.gridSpacing = 28; // Half tile size
        this.maxTraySize = 7;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadLevels();
        this.startLevel();
    }
    
    bindEvents() {
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
        document.getElementById('btn-shuffle').addEventListener('click', () => this.shuffleBoard());
        document.getElementById('btn-next').addEventListener('click', () => {
            this.modal.classList.add('hidden');
            if (this.isWinState) {
                this.currentLevelIndex++;
                if (this.currentLevelIndex >= this.levels.length) this.currentLevelIndex = 0;
            } else {
                // Game over, reset score
                this.score = 0;
                this.scoreDisplay.textContent = this.score;
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
            // Fallback levels if file load fails
            this.levels = [
                {
                    "layers": [
                        [{"c":2,"r":2},{"c":4,"r":2},{"c":6,"r":2},{"c":2,"r":4},{"c":4,"r":4},{"c":6,"r":4}],
                        [{"c":3,"r":3},{"c":5,"r":3},{"c":4,"r":1}]
                    ],
                    "typesCount": 3
                }
            ];
        }
    }
    
    startLevel() {
        this.boardEl.innerHTML = '';
        this.tiles = [];
        this.trayTiles = [];
        this.moveHistory = [];
        this.isWinState = false;
        
        this.levelDisplay.textContent = this.currentLevelIndex + 1;
        
        const levelData = this.levels[this.currentLevelIndex];
        
        // Calculate total tiles to generate pairs of 3
        let totalTiles = 0;
        levelData.layers.forEach(l => totalTiles += l.length);
        
        if (totalTiles % 3 !== 0) {
            console.error("Level tile count must be a multiple of 3!");
        }
        
        // Generate pool of emojis
        const typesCount = Math.min(levelData.typesCount, EMOJIS.length);
        const pool = [];
        for (let i = 0; i < totalTiles / 3; i++) {
            const typeIndex = i % typesCount;
            pool.push(EMOJIS[typeIndex], EMOJIS[typeIndex], EMOJIS[typeIndex]);
        }
        
        // Shuffle pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        
        // Find board bounds to center it
        let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
        levelData.layers.forEach(layer => {
            layer.forEach(pos => {
                minC = Math.min(minC, pos.c); maxC = Math.max(maxC, pos.c);
                minR = Math.min(minR, pos.r); maxR = Math.max(maxR, pos.r);
            });
        });
        
        const boardRect = this.boardEl.getBoundingClientRect();
        // Fallback for when rendering hasn't completed sizing
        const boardW = boardRect.width || 400; 
        
        const centerC = (minC + maxC) / 2;
        const offsetX = boardW / 2 - (centerC * this.gridSpacing);
        const offsetY = 60 - (minR * this.gridSpacing); 

        // Create tile DOM elements
        let tileId = 0;
        levelData.layers.forEach((layer, zIndex) => {
            layer.forEach(pos => {
                const type = pool.pop();
                
                const x = pos.c * this.gridSpacing + offsetX;
                const y = pos.r * this.gridSpacing + offsetY;
                
                const el = document.createElement('div');
                el.className = 'tile';
                el.textContent = type;
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.zIndex = zIndex * 10;
                
                // Store base left/top for Undo
                el.dataset.baseLeft = x;
                el.dataset.baseTop = y;
                el.dataset.baseZ = zIndex * 10;
                
                const tileObj = {
                    id: tileId++,
                    element: el,
                    type: type,
                    c: pos.c,
                    r: pos.r,
                    z: zIndex,
                    status: 'board' // 'board', 'tray', 'cleared'
                };
                
                el.addEventListener('pointerdown', (e) => this.handleTileClick(e, tileObj));
                
                this.boardEl.appendChild(el);
                this.tiles.push(tileObj);
            });
        });
        
        this.updateCoveredStates();
    }
    
    updateCoveredStates() {
        this.tiles.forEach(tileA => {
            if (tileA.status !== 'board') return;
            
            let isCovered = false;
            // Check if any board tile is strictly above it and overlapping
            for (let tileB of this.tiles) {
                if (tileB.status !== 'board') continue;
                if (tileB.z > tileA.z) {
                    if (Math.abs(tileA.c - tileB.c) < 2 && Math.abs(tileA.r - tileB.r) < 2) {
                        isCovered = true;
                        break;
                    }
                }
            }
            
            if (isCovered) {
                tileA.element.classList.add('covered');
            } else {
                tileA.element.classList.remove('covered');
            }
        });
    }
    
    handleTileClick(e, tile) {
        if (e.button !== undefined && e.button !== 0) return;
        if (tile.status !== 'board') return;
        if (tile.element.classList.contains('covered')) return;
        if (this.trayTiles.length >= this.maxTraySize) return;
        
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.synth.playClick();
        
        tile.status = 'tray';
        tile.element.classList.add('in-tray');
        
        tile.element.style.marginLeft = '0';
        tile.element.style.marginTop = '0';
        
        // Group identical types together in tray
        let insertIdx = this.trayTiles.length;
        for (let i = this.trayTiles.length - 1; i >= 0; i--) {
            if (this.trayTiles[i].type === tile.type) {
                insertIdx = i + 1;
                break;
            }
        }
        
        this.trayTiles.splice(insertIdx, 0, tile);
        this.moveHistory.push(tile); // For undo
        
        this.repositionTrayTiles();
        this.updateCoveredStates();
        
        this.checkMatches();
    }
    
    repositionTrayTiles() {
        const boardRect = this.boardEl.getBoundingClientRect();
        
        this.trayTiles.forEach((tile, index) => {
            const slot = this.traySlots[index];
            const slotRect = slot.getBoundingClientRect();
            
            // Calculate slot position relative to board-container
            const left = slotRect.left - boardRect.left;
            const top = slotRect.top - boardRect.top;
            
            tile.element.style.left = `${left}px`;
            tile.element.style.top = `${top}px`;
            tile.element.style.zIndex = 1000 + index;
        });
    }
    
    checkMatches() {
        const counts = {};
        this.trayTiles.forEach(t => {
            counts[t.type] = (counts[t.type] || 0) + 1;
        });
        
        let matchedType = null;
        for (const type in counts) {
            if (counts[type] >= 3) {
                matchedType = type;
                break;
            }
        }
        
        if (matchedType) {
            setTimeout(() => {
                this.synth.playMatch();
                this.score += 30;
                this.scoreDisplay.textContent = this.score;
                
                const matchedTiles = this.trayTiles.filter(t => t.type === matchedType).slice(0, 3);
                
                matchedTiles.forEach(t => {
                    t.status = 'cleared';
                    t.element.classList.add('clearing');
                    setTimeout(() => t.element.remove(), 400);
                    
                    const hIdx = this.moveHistory.indexOf(t);
                    if (hIdx > -1) this.moveHistory.splice(hIdx, 1);
                });
                
                this.trayTiles = this.trayTiles.filter(t => !matchedTiles.includes(t));
                this.repositionTrayTiles();
                
                this.checkWinCondition();
            }, 300);
        } else {
            // Check Game Over
            if (this.trayTiles.length >= this.maxTraySize) {
                setTimeout(() => {
                    this.synth.playGameOver();
                    this.isWinState = false;
                    document.getElementById('modal-title').textContent = "GAME OVER";
                    document.getElementById('modal-desc').textContent = "No more space in the tray!";
                    document.getElementById('btn-next').textContent = "RESTART";
                    this.modal.classList.remove('hidden');
                }, 400);
            }
        }
    }
    
    checkWinCondition() {
        if (this.tiles.every(t => t.status === 'cleared')) {
            setTimeout(() => {
                this.synth.playLevelUp();
                this.isWinState = true;
                document.getElementById('modal-title').textContent = "LEVEL COMPLETE!";
                document.getElementById('modal-desc').textContent = `Score: ${this.score}`;
                document.getElementById('btn-next').textContent = "NEXT LEVEL";
                this.modal.classList.remove('hidden');
            }, 500);
        }
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const tile = this.moveHistory.pop();
        
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.synth.playUndo();
        
        const tIdx = this.trayTiles.indexOf(tile);
        if (tIdx > -1) this.trayTiles.splice(tIdx, 1);
        
        tile.status = 'board';
        tile.element.classList.remove('in-tray');
        
        tile.element.style.marginLeft = `calc(var(--tile-size) / -2)`;
        tile.element.style.marginTop = `calc(var(--tile-size) / -2)`;
        
        tile.element.style.left = `${tile.element.dataset.baseLeft}px`;
        tile.element.style.top = `${tile.element.dataset.baseTop}px`;
        tile.element.style.zIndex = tile.element.dataset.baseZ;
        
        this.repositionTrayTiles();
        this.updateCoveredStates();
    }
    
    shuffleBoard() {
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        this.synth.playShuffle();
        
        const boardTiles = this.tiles.filter(t => t.status === 'board');
        const types = boardTiles.map(t => t.type);
        
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        
        boardTiles.forEach((t, i) => {
            t.type = types[i];
            
            t.element.style.transform = 'scale(0) rotate(180deg)';
            setTimeout(() => {
                t.element.textContent = t.type;
                t.element.style.transform = '';
            }, 150);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TripleTileGame();
});
