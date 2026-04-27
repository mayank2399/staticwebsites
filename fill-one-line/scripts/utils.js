// Canvas scaling for high-DPI (Retina) displays
function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Get the DPR and size of the canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Normalize coordinate system to use css pixels
    ctx.scale(dpr, dpr);
    
    return {
        width: rect.width,
        height: rect.height,
        ctx: ctx
    };
}

// Distance helper
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Local Storage Helper
const StorageManager = {
    key: 'fill-one-line-progress',
    
    saveLevel(levelIndex) {
        try {
            localStorage.setItem(this.key, levelIndex.toString());
        } catch (e) {
            console.error('Could not save progress', e);
        }
    },
    
    loadLevel() {
        try {
            const saved = localStorage.getItem(this.key);
            return saved !== null ? parseInt(saved, 10) : 0;
        } catch (e) {
            console.error('Could not load progress', e);
            return 0;
        }
    }
};
