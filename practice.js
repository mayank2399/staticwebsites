let startTime, endTime, running = false
let times = [];
let timerInterval;

function generateScramble() {

    const moves = ["U", "D", "L", "R", "F", "B"];
    const modifiers = ["", "'", "2"];
    let scramble = [];
    let lastMoves = "";

    for (let i = 1; i <= 20; i++) {
        let move;
        do {
            move = moves[Math.floor(Math.random() * moves.length)];
        } while (move == lastMoves);
        lastMoves = move;
        let modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        scramble.push(move + modifier);
    };
    return scramble.join(" ");
};

document.getElementById("scramble").innerText = "3X3 Rubiks cube \n " + generateScramble()


function startTimer() {
    if (!running) {
        startTime = performance.now();
        running = true;
        timerInterval = requestAnimationFrame(updateTimer);
    }
};


function stopTimer() {
    if (running) {
        endTime = performance.now();
        running = false;
        let time = (endTime - startTime) / 1000;
        times.push(time);
        displayTime(time);
    }
};

function updateTimer() {
    if (running) {
        let currentTime = (performance.now() - startTime) / 1000;
        document.getElementById("timer").innerHTML = currentTime.toFixed(2)+"s";
        timerInterval = requestAnimationFrame(updateTimer);
    }
};

function displayTime(time) {
    document.getElementById("timer").innerHTML = time.toFixed(2) + "s";
};

document.getElementById("startStop").addEventListener("click", function () {
    if (running)
        stopTimer();
    else
        startTimer();
});

document.addEventListener("keydown", (event) => {
    if (event.key == " ") {
        if (running)
            stopTimer();
        else
            startTimer();
    }
});

function calculateAverage() {
    if (times.length >= 5) {
        let avg5 = calculateAverage(times.slice(-5));
        document.getElementById("avg5").innerHTML = avg5.toFixed(2) + "s";
    }
}

function calculateAverage(arr) {
    arr.sort((a, b) => a - b);
    let relevantTime = arr.slice(1, arr.length - 1);
    let sum = relevantTime.reduce((a, b) => a + b, 0);
    return sum / relevantTime.length;
}

function goNextTimer() {
    running = false;
    cancelAnimationFrame(timerInterval);
    document.getElementById("timer").innerHTML = "0.00s";
    document.getElementById("scramble").innerHTML = generateScramble();
}

function resetTimer() {
    running = false;
    cancelAnimationFrame(timerInterval);
    document.getElementById("avg5").innerHTML = "N/A";
    document.getElementById("timer").innerHTML = "0.00s";
    document.getElementById("scramble").innerHTML = generateScramble();
}

document.getElementById("next").addEventListener("click", goNextTimer);
document.getElementById("reset").addEventListener("click", resetTimer);