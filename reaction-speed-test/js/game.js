/**
 * Reaction Speed Test Game Logic
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
    playSuccess() {
        // High beep
        this.playTone(1000, 'sine', 0.1, 0.1);
    }
    playEarly() {
        // Dull buzz
        this.playTone(200, 'sawtooth', 0.2, 0.1);
    }
}

const STATES = {
    IDLE: 'idle',
    WAIT: 'wait',
    GO: 'go',
    RESULT: 'result',
    EARLY: 'early',
    FINISHED: 'finished'
};

class ReactionTest {
    constructor() {
        this.synth = new AudioSynth();
        
        this.app = document.getElementById('app');
        this.mainText = document.getElementById('main-text');
        this.subText = document.getElementById('sub-text');
        this.icon = document.getElementById('icon');
        
        this.roundCounter = document.getElementById('round-counter');
        this.bestTimeDisplay = document.getElementById('best-time');
        
        this.resultsModal = document.getElementById('results-modal');
        this.finalAvgDisplay = document.getElementById('final-avg');
        this.timesList = document.getElementById('times-list');
        
        this.state = STATES.IDLE;
        
        this.timeoutId = null;
        this.startTime = 0;
        
        this.times = [];
        this.maxRounds = 5;
        
        this.bestTime = localStorage.getItem('reactionTestBest') || '--';
        this.bestTimeDisplay.textContent = this.bestTime;
        
        this.init();
    }
    
    init() {
        // Pointer down handles both mouse clicks and touch instantly
        this.app.addEventListener('pointerdown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            this.handleInteraction();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                this.handleInteraction();
            }
        });
        
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.resultsModal.classList.add('hidden');
            this.resetGame();
        });
        
        this.setUI(STATES.IDLE);
    }
    
    resetGame() {
        this.times = [];
        this.setUI(STATES.IDLE);
    }
    
    handleInteraction() {
        if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();
        
        switch (this.state) {
            case STATES.IDLE:
            case STATES.RESULT:
            case STATES.EARLY:
                this.startWait();
                break;
            case STATES.WAIT:
                this.triggerEarly();
                break;
            case STATES.GO:
                this.recordTime();
                break;
            case STATES.FINISHED:
                // Ignored, handled by restart button
                break;
        }
    }
    
    setUI(newState) {
        this.state = newState;
        this.app.className = `state-${newState}`;
        
        // Update round counter
        if (newState === STATES.FINISHED) {
            this.roundCounter.textContent = `ROUND 5 / 5`;
        } else {
            this.roundCounter.textContent = `ROUND ${this.times.length} / 5`;
        }
        
        switch (newState) {
            case STATES.IDLE:
                this.icon.textContent = '⚡';
                this.mainText.textContent = 'Reaction Time Test';
                this.subText.innerHTML = 'When the red box turns green, click as quickly as you can.<br>Click anywhere to begin.';
                break;
            case STATES.WAIT:
                this.icon.textContent = '🔴';
                this.mainText.textContent = 'Wait for green...';
                this.subText.textContent = '';
                break;
            case STATES.GO:
                this.icon.textContent = '🟢';
                this.mainText.textContent = 'Click!';
                this.subText.textContent = '';
                break;
            case STATES.RESULT:
                const lastTime = this.times[this.times.length - 1];
                this.icon.textContent = '⏱️';
                this.mainText.textContent = `${lastTime} ms`;
                this.subText.textContent = 'Click to keep going.';
                break;
            case STATES.EARLY:
                this.icon.textContent = '⚠️';
                this.mainText.textContent = 'Too soon!';
                this.subText.textContent = 'Click to try again.';
                break;
        }
    }
    
    startWait() {
        this.setUI(STATES.WAIT);
        
        // Random delay between 1.5s and 5s
        const delay = 1500 + Math.random() * 3500;
        
        this.timeoutId = setTimeout(() => {
            this.triggerGo();
        }, delay);
    }
    
    triggerGo() {
        this.setUI(STATES.GO);
        this.startTime = performance.now();
    }
    
    triggerEarly() {
        clearTimeout(this.timeoutId);
        this.synth.playEarly();
        this.setUI(STATES.EARLY);
    }
    
    recordTime() {
        const endTime = performance.now();
        const reactTime = Math.round(endTime - this.startTime);
        
        this.synth.playSuccess();
        this.times.push(reactTime);
        
        if (this.times.length >= this.maxRounds) {
            this.showFinished();
        } else {
            this.setUI(STATES.RESULT);
        }
    }
    
    showFinished() {
        this.setUI(STATES.FINISHED);
        
        const sum = this.times.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / this.times.length);
        
        this.finalAvgDisplay.textContent = avg;
        
        // Populate list
        this.timesList.innerHTML = '';
        this.times.forEach((t, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>Round ${i + 1}</span> <span>${t} ms</span>`;
            this.timesList.appendChild(li);
        });
        
        // Save best
        if (this.bestTime === '--' || avg < parseInt(this.bestTime)) {
            this.bestTime = avg;
            localStorage.setItem('reactionTestBest', this.bestTime);
            this.bestTimeDisplay.textContent = this.bestTime;
        }
        
        this.resultsModal.classList.remove('hidden');
    }
}

window.onload = () => {
    new ReactionTest();
};
