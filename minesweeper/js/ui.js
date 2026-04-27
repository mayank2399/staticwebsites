/**
 * UI Interaction Module
 */

class UIManager {
    constructor(gameController) {
        this.controller = gameController;
        this.boardEl = document.getElementById('game-board');
        this.flagCountEl = document.getElementById('flag-count');
        this.timerEl = document.getElementById('timer');
        this.btnRestart = document.getElementById('btn-restart');
        
        // Timer state
        this.timerInterval = null;
        this.secondsElapsed = 0;
        
        this.cellElements = [];
        this.touchTimer = null;
        
        this.setupCellSize();
        window.addEventListener('resize', () => this.setupCellSize());
    }

    setupCellSize() {
        const boardWrapper = document.querySelector('.board-wrapper');
        const settings = this.controller.getSettings();
        const { width, height } = this.controller.getBoardDimensions(settings);
        
        const wrapperRect = boardWrapper.getBoundingClientRect();
        // Give some padding
        const maxWidth = wrapperRect.width - 32;
        const maxHeight = wrapperRect.height - 32;
        
        let cellSize = Math.min(maxWidth / width, maxHeight / height, 40); // Max 40px
        cellSize = Math.max(cellSize, 20); // Min 20px
        
        document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
    }

    renderBoard(width, height) {
        this.boardEl.innerHTML = '';
        this.boardEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        this.cellElements = Array.from({ length: height }, () => new Array(width));
        
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.setAttribute('tabindex', '-1');
                
                // Event Listeners
                cell.addEventListener('mousedown', (e) => this.handleMouseDown(e, r, c));
                cell.addEventListener('mouseup', (e) => this.handleMouseUp(e, r, c));
                cell.addEventListener('contextmenu', (e) => this.handleContextMenu(e, r, c));
                
                // Touch events for long press
                cell.addEventListener('touchstart', (e) => this.handleTouchStart(e, r, c), {passive: false});
                cell.addEventListener('touchend', (e) => this.handleTouchEnd(e, r, c));
                cell.addEventListener('touchcancel', (e) => this.handleTouchEnd(e, r, c));
                
                this.boardEl.appendChild(cell);
                this.cellElements[r][c] = cell;
            }
        }
        
        this.boardEl.focus(); // Focus board for keyboard nav
    }

    handleMouseDown(e, r, c) {
        if (e.button === 0) {
            this.btnRestart.textContent = '😮';
        }
    }

    handleMouseUp(e, r, c) {
        if (e.button === 0) {
            this.btnRestart.textContent = '😊';
            this.controller.handleCellClick(r, c);
        }
    }

    handleContextMenu(e, r, c) {
        e.preventDefault();
        this.controller.handleCellRightClick(r, c);
    }

    handleTouchStart(e, r, c) {
        // e.preventDefault(); // Commenting this out allows scrolling but might conflict with long press. 
        // Best approach for games: e.preventDefault() on touchstart for cells to prevent zoom/scroll.
        if (e.cancelable) e.preventDefault();
        
        this.btnRestart.textContent = '😮';
        this.touchTimer = setTimeout(() => {
            this.controller.handleCellRightClick(r, c);
            this.touchTimer = null;
            this.btnRestart.textContent = '😊';
        }, 500); // 500ms for long press
    }

    handleTouchEnd(e, r, c) {
        if (e.cancelable) e.preventDefault();
        
        if (this.touchTimer) {
            clearTimeout(this.touchTimer);
            this.touchTimer = null;
            this.btnRestart.textContent = '😊';
            this.controller.handleCellClick(r, c);
        }
    }

    updateCell(r, c, state) {
        const cell = this.cellElements[r][c];
        
        if (state.isRevealed) {
            cell.classList.add('revealed');
            cell.classList.remove('flag');
            
            if (state.isMine) {
                cell.classList.add('mine');
                cell.textContent = '💣';
            } else if (state.value > 0) {
                cell.dataset.adjacent = state.value;
                cell.textContent = state.value;
            } else {
                cell.textContent = '';
            }
        } else if (state.isFlagged) {
            cell.classList.add('flag');
            cell.textContent = '🚩';
        } else {
            cell.classList.remove('flag');
            cell.textContent = '';
        }
    }

    showWrongFlag(r, c) {
        const cell = this.cellElements[r][c];
        cell.classList.add('revealed');
        cell.textContent = '❌';
    }

    updateMineCount(count) {
        this.flagCountEl.textContent = String(Math.max(0, count)).padStart(3, '0');
    }

    startTimer() {
        if (this.timerInterval) return;
        this.secondsElapsed = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            if (this.secondsElapsed < 999) {
                this.secondsElapsed++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    resetTimer() {
        this.stopTimer();
        this.secondsElapsed = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        this.timerEl.textContent = String(this.secondsElapsed).padStart(3, '0');
    }

    setFace(state) {
        switch(state) {
            case 'win': this.btnRestart.textContent = '😎'; break;
            case 'lose': this.btnRestart.textContent = '😵'; break;
            case 'playing': this.btnRestart.textContent = '😊'; break;
        }
    }
    
    // Modals
    showModal(id) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }

    hideModals() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    showGameOver(isWin, time, bestTime) {
        const titleEl = document.getElementById('game-over-title');
        const msgEl = document.getElementById('game-over-message');
        const timeEl = document.getElementById('stat-time');
        const bestEl = document.getElementById('stat-best');
        
        if (isWin) {
            titleEl.textContent = 'Victory!';
            msgEl.textContent = 'You cleared the minefield!';
            this.triggerConfetti();
        } else {
            titleEl.textContent = 'Game Over';
            msgEl.textContent = 'You hit a mine!';
        }
        
        timeEl.textContent = time;
        bestEl.textContent = bestTime !== null ? bestTime : '-';
        
        setTimeout(() => {
            this.showModal('modal-game-over');
        }, 1000); // Wait 1 second before showing modal to allow animations
    }

    triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const pieces = [];
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
        
        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 5 + 5,
                c: colors[Math.floor(Math.random() * colors.length)],
                dx: Math.random() * 4 - 2,
                dy: Math.random() * 5 + 2,
                r: Math.random() * 360,
                dr: Math.random() * 10 - 5
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            pieces.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                p.r += p.dr;
                
                if (p.y < canvas.height) active = true;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.r * Math.PI / 180);
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
                ctx.restore();
            });
            
            if (active) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        
        animate();
    }
}
