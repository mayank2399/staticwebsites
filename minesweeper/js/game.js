/**
 * Minesweeper Game Logic Module
 */

class MinesweeperGame {
    constructor(width, height, mines) {
        this.width = width;
        this.height = height;
        this.totalMines = Math.min(mines, width * height - 1); // Ensure at least 1 safe cell
        
        this.board = [];
        this.state = 'ready'; // ready, playing, won, lost
        this.flagsPlaced = 0;
        this.cellsRevealed = 0;
        
        this.initBoard();
    }
    
    initBoard() {
        this.board = Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            }))
        );
    }
    
    // Defer mine placement until first click to ensure the first click is always safe
    placeMines(firstClickY, firstClickX) {
        let minesToPlace = this.totalMines;
        
        while (minesToPlace > 0) {
            const r = Math.floor(Math.random() * this.height);
            const c = Math.floor(Math.random() * this.width);
            
            // Don't place mine on the first clicked cell, or if already a mine
            if (!this.board[r][c].isMine && !(r === firstClickY && c === firstClickX)) {
                // Optional: also keep 3x3 area around first click safe
                if (Math.abs(r - firstClickY) <= 1 && Math.abs(c - firstClickX) <= 1) {
                    continue; // Skip placing mine right next to first click
                }
                
                this.board[r][c].isMine = true;
                minesToPlace--;
            }
        }
        
        this.calculateAdjacentMines();
        this.state = 'playing';
    }
    
    calculateAdjacentMines() {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (!this.board[r][c].isMine) {
                    let count = 0;
                    this.forEachNeighbor(r, c, (nr, nc) => {
                        if (this.board[nr][nc].isMine) count++;
                    });
                    this.board[r][c].adjacentMines = count;
                }
            }
        }
    }
    
    forEachNeighbor(r, c, callback) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const nr = r + i;
                const nc = c + j;
                if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) {
                    callback(nr, nc);
                }
            }
        }
    }
    
    reveal(r, c) {
        if (this.state === 'ready') {
            this.placeMines(r, c);
        }
        
        if (this.state !== 'playing' || this.board[r][c].isRevealed || this.board[r][c].isFlagged) {
            return { success: false };
        }
        
        if (this.board[r][c].isMine) {
            this.state = 'lost';
            this.board[r][c].isRevealed = true;
            return { success: true, hitMine: true, r, c };
        }
        
        const revealedCells = [];
        this.floodFill(r, c, revealedCells);
        
        this.checkWinCondition();
        
        return { success: true, hitMine: false, revealedCells };
    }
    
    floodFill(r, c, revealedCells) {
        const queue = [[r, c]];
        
        while (queue.length > 0) {
            const [currR, currC] = queue.shift();
            const cell = this.board[currR][currC];
            
            if (cell.isRevealed || cell.isFlagged) continue;
            
            cell.isRevealed = true;
            this.cellsRevealed++;
            revealedCells.push({ r: currR, c: currC, value: cell.adjacentMines });
            
            if (cell.adjacentMines === 0) {
                this.forEachNeighbor(currR, currC, (nr, nc) => {
                    if (!this.board[nr][nc].isRevealed && !this.board[nr][nc].isFlagged) {
                        queue.push([nr, nc]);
                    }
                });
            }
        }
    }
    
    toggleFlag(r, c) {
        if (this.state !== 'playing' && this.state !== 'ready') return null;
        
        const cell = this.board[r][c];
        if (cell.isRevealed) return null;
        
        cell.isFlagged = !cell.isFlagged;
        this.flagsPlaced += cell.isFlagged ? 1 : -1;
        
        return cell.isFlagged;
    }
    
    checkWinCondition() {
        const totalSafeCells = this.width * this.height - this.totalMines;
        if (this.cellsRevealed === totalSafeCells) {
            this.state = 'won';
        }
    }
    
    revealAllMines() {
        const mines = [];
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.board[r][c].isMine && !this.board[r][c].isFlagged) {
                    this.board[r][c].isRevealed = true;
                    mines.push({r, c});
                }
            }
        }
        return mines;
    }

    getWrongFlags() {
        const wrongFlags = [];
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.board[r][c].isFlagged && !this.board[r][c].isMine) {
                    wrongFlags.push({r, c});
                }
            }
        }
        return wrongFlags;
    }
}
