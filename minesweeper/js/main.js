/**
 * Main Controller
 */

class GameController {
    constructor() {
        this.settings = StorageManager.loadSettings();
        this.applyTheme(this.settings.theme);
        
        this.game = null;
        this.ui = new UIManager(this);
        
        this.bindEvents();
        this.startNewGame();
    }
    
    bindEvents() {
        // Theme toggle
        document.getElementById('btn-theme').addEventListener('click', () => {
            this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme(this.settings.theme);
            StorageManager.saveSettings(this.settings);
        });
        
        // Settings modal
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.populateSettingsForm();
            this.ui.showModal('modal-settings');
        });
        
        // Close modals
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', () => this.ui.hideModals());
        });
        
        // Restart button
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.ui.hideModals();
            this.startNewGame();
        });
        
        // Difficulty select logic
        const diffSelect = document.getElementById('difficulty-select');
        const customSettings = document.getElementById('custom-settings');
        diffSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customSettings.classList.remove('hidden');
            } else {
                customSettings.classList.add('hidden');
            }
        });
        
        // Save Settings
        document.getElementById('btn-save-settings').addEventListener('click', () => {
            this.saveSettingsForm();
            this.ui.hideModals();
            this.startNewGame();
        });

        // Keyboard navigation setup
        document.getElementById('game-board').addEventListener('keydown', (e) => this.handleKeyboardNav(e));
    }
    
    applyTheme(theme) {
        const app = document.getElementById('app');
        if (theme === 'dark') {
            app.classList.add('theme-dark');
        } else {
            app.classList.remove('theme-dark');
        }
    }
    
    getBoardDimensions(settings) {
        let width, height, mines;
        if (settings.difficulty === 'beginner') {
            width = 8; height = 8; mines = 10;
        } else if (settings.difficulty === 'intermediate') {
            width = 16; height = 16; mines = 40;
        } else if (settings.difficulty === 'expert') {
            width = 24; height = 24; mines = 99;
        } else {
            width = settings.custom.width;
            height = settings.custom.height;
            mines = settings.custom.mines;
        }
        return { width, height, mines };
    }
    
    getSettings() {
        return this.settings;
    }

    startNewGame() {
        const { width, height, mines } = this.getBoardDimensions(this.settings);
        
        this.game = new MinesweeperGame(width, height, mines);
        
        this.ui.renderBoard(width, height);
        this.ui.setupCellSize();
        this.ui.resetTimer();
        this.ui.updateMineCount(this.game.totalMines);
        this.ui.setFace('playing');
        
        // Clear canvas if confetti was running
        const canvas = document.getElementById('confetti-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Initialize cursor for keyboard nav (0,0)
        this.cursorR = 0;
        this.cursorC = 0;
    }
    
    handleCellClick(r, c) {
        if (this.game.state === 'won' || this.game.state === 'lost') return;
        
        if (this.game.state === 'ready') {
            this.ui.startTimer();
        }
        
        const result = this.game.reveal(r, c);
        
        if (!result.success) return; // Flagged or already revealed
        
        if (result.hitMine) {
            this.handleLoss(result.r, result.c);
        } else {
            // Update all newly revealed cells
            result.revealedCells.forEach(cell => {
                this.ui.updateCell(cell.r, cell.c, { isRevealed: true, value: cell.value });
            });
            
            if (this.game.state === 'won') {
                this.handleWin();
            }
        }
    }
    
    handleCellRightClick(r, c) {
        if (this.game.state === 'won' || this.game.state === 'lost') return;
        if (this.game.state === 'ready') {
            this.ui.startTimer();
            // Edge case: Right click on first move should technically be allowed, 
            // but we need to init board without placing mines yet. Game handles this nicely as it stays 'ready'.
        }
        
        const isFlagged = this.game.toggleFlag(r, c);
        if (isFlagged !== null) {
            this.ui.updateCell(r, c, { isRevealed: false, isFlagged: isFlagged });
            this.ui.updateMineCount(this.game.totalMines - this.game.flagsPlaced);
        }
    }
    
    handleLoss(clickedR, clickedC) {
        this.ui.stopTimer();
        this.ui.setFace('lose');
        
        // Reveal all other mines
        const mines = this.game.revealAllMines();
        mines.forEach(mine => {
            if (!(mine.r === clickedR && mine.c === clickedC)) {
                this.ui.updateCell(mine.r, mine.c, { isRevealed: true, isMine: true });
            }
        });
        
        // Highlight clicked mine
        const clickedCell = this.ui.cellElements[clickedR][clickedC];
        clickedCell.classList.add('revealed', 'mine');
        clickedCell.style.backgroundColor = '#b91c1c'; // Darker red for the clicked mine
        
        // Show wrong flags
        const wrongFlags = this.game.getWrongFlags();
        wrongFlags.forEach(f => {
            this.ui.showWrongFlag(f.r, f.c);
        });
        
        this.ui.showGameOver(false, this.ui.secondsElapsed, StorageManager.getBestTime(this.settings.difficulty));
    }
    
    handleWin() {
        this.ui.stopTimer();
        this.ui.setFace('win');
        
        const time = this.ui.secondsElapsed;
        const diff = this.settings.difficulty;
        
        // Save best time
        let bestTime = StorageManager.getBestTime(diff);
        if (diff !== 'custom') {
            StorageManager.saveBestTime(diff, time);
            bestTime = StorageManager.getBestTime(diff); // Reload to get updated
        }
        
        this.ui.showGameOver(true, time, diff === 'custom' ? '-' : bestTime);
    }
    
    populateSettingsForm() {
        const diffSelect = document.getElementById('difficulty-select');
        diffSelect.value = this.settings.difficulty;
        
        if (this.settings.difficulty === 'custom') {
            document.getElementById('custom-settings').classList.remove('hidden');
        } else {
            document.getElementById('custom-settings').classList.add('hidden');
        }
        
        document.getElementById('input-width').value = this.settings.custom.width;
        document.getElementById('input-height').value = this.settings.custom.height;
        document.getElementById('input-mines').value = this.settings.custom.mines;
    }
    
    saveSettingsForm() {
        const diff = document.getElementById('difficulty-select').value;
        this.settings.difficulty = diff;
        
        if (diff === 'custom') {
            let w = parseInt(document.getElementById('input-width').value) || 8;
            let h = parseInt(document.getElementById('input-height').value) || 8;
            let m = parseInt(document.getElementById('input-mines').value) || 10;
            
            // Clamp values
            w = Math.max(4, Math.min(30, w));
            h = Math.max(4, Math.min(30, h));
            m = Math.max(1, Math.min(w * h - 1, m));
            
            this.settings.custom = { width: w, height: h, mines: m };
        }
        
        StorageManager.saveSettings(this.settings);
    }

    handleKeyboardNav(e) {
        if (this.game.state === 'won' || this.game.state === 'lost') return;
        
        const key = e.key;
        const { width, height } = this.getBoardDimensions(this.settings);
        
        let moved = false;
        if (key === 'ArrowUp') { this.cursorR = Math.max(0, this.cursorR - 1); moved = true; }
        else if (key === 'ArrowDown') { this.cursorR = Math.min(height - 1, this.cursorR + 1); moved = true; }
        else if (key === 'ArrowLeft') { this.cursorC = Math.max(0, this.cursorC - 1); moved = true; }
        else if (key === 'ArrowRight') { this.cursorC = Math.min(width - 1, this.cursorC + 1); moved = true; }
        
        if (moved) {
            e.preventDefault();
            this.ui.cellElements[this.cursorR][this.cursorC].focus();
        } else if (key === 'Enter' || key === ' ') {
            e.preventDefault();
            this.handleCellClick(this.cursorR, this.cursorC);
            // Re-focus after click might be needed if UI changes disrupt it
            setTimeout(() => {
                if (this.ui.cellElements[this.cursorR] && this.ui.cellElements[this.cursorR][this.cursorC]) {
                   this.ui.cellElements[this.cursorR][this.cursorC].focus();
                }
            }, 10);
        } else if (key === 'f' || key === 'F') {
            e.preventDefault();
            this.handleCellRightClick(this.cursorR, this.cursorC);
        }
    }
}

// Boot up
document.addEventListener('DOMContentLoaded', () => {
    new GameController();
});
