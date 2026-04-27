/**
 * LocalStorage management module
 */

const StorageManager = {
    saveSettings: function(settings) {
        try {
            localStorage.setItem('minesweeper_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Could not save settings to localStorage');
        }
    },
    
    loadSettings: function() {
        try {
            const settings = localStorage.getItem('minesweeper_settings');
            if (settings) {
                return JSON.parse(settings);
            }
        } catch (e) {
            console.warn('Could not load settings from localStorage');
        }
        // Default settings
        return {
            difficulty: 'beginner',
            custom: { width: 8, height: 8, mines: 10 },
            theme: 'dark' // dark or light
        };
    },
    
    saveBestTime: function(difficulty, time) {
        try {
            const bestTimesStr = localStorage.getItem('minesweeper_bests');
            let bestTimes = bestTimesStr ? JSON.parse(bestTimesStr) : {};
            
            if (!bestTimes[difficulty] || time < bestTimes[difficulty]) {
                bestTimes[difficulty] = time;
                localStorage.setItem('minesweeper_bests', JSON.stringify(bestTimes));
                return true; // New best time!
            }
            return false;
        } catch (e) {
            console.warn('Could not save best time');
            return false;
        }
    },
    
    getBestTime: function(difficulty) {
        try {
            const bestTimesStr = localStorage.getItem('minesweeper_bests');
            if (bestTimesStr) {
                const bestTimes = JSON.parse(bestTimesStr);
                return bestTimes[difficulty] || null;
            }
        } catch (e) {
            console.warn('Could not get best time');
        }
        return null;
    }
};
