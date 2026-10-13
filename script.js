const characters = [
    { id: "workaholic", name: "Workaholic", img: "./images/workaholic.png", fallback: "💼" },
    { id: "shopaholic", name: "Shopaholic", img: "./images/shopaholic.png", fallback: "🛍️" },
    { id: "adventurer", name: "Adventurer", img: "./images/adventurer.png", fallback: "🗺️" },
    { id: "drifter", name: "Drifter", img: "images/drifter.png", fallback: "🌾" },
    { id: "senior", name: "Senior", img: "images/senior.png", fallback: "👴" },
    { id: "scavenger", name: "Scavenger", img: "images/scavenger.png", fallback: "🗑️" },
    { id: "mystic", name: "Mystic", img: "images/mystic.png", fallback: "🧘" },
    { id: "hacker", name: "Hacker", img: "images/hacker.png", fallback: "💻" },
    { id: "artist", name: "Artist", img: "images/artist.png", fallback: "🎨" }
];

let state = {};
let historyList = [];

characters.forEach(c => {
    state[c.id] = { drawn: false, locked: false };
});

let isDrawing = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq = 440, duration = 0.05) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function playWinSound() {
    try {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
        notes.forEach((freq, idx) => {
            setTimeout(() => playBeep(freq, 0.15), idx * 80);
        });
    } catch(e) {}
}

function renderGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    characters.forEach(char => {
        const charState = state[char.id];
        const card = document.createElement("div");
        
        let classNames = ["card"];
        if (charState.drawn) classNames.push("drawn");
        else if (charState.locked) classNames.push("locked");

        card.className = classNames.join(" ");
        card.id = `card-${char.id}`;
        card.onclick = () => toggleLock(char.id);

        let badgeText = "PRONTO";
        let badgeClass = "available";
        if (charState.drawn) {
            badgeText = "SORTEADO";
            badgeClass = "drawn";
        } else if (charState.locked) {
            badgeText = "BLOQUEADO";
            badgeClass = "locked";
        }

        card.innerHTML = `
            <div class="status-badge ${badgeClass}">${badgeText}</div>
            <div class="stamp-drawn">FORA!</div>
            <div class="card-inner-bg">
                <img class="card-img" src="${char.img}" alt="${char.name}" 
                     onerror="this.onerror=null; this.parentNode.innerHTML='<span class=\\'placeholder-icon\\'>${char.fallback}</span>';">
            </div>
            <div class="card-title-box">
                <h3 class="card-title">${char.name}</h3>
            </div>
        `;

        grid.appendChild(card);
    });

    updateCounter();
    renderHistory();
}

function renderHistory() {
    const historyContainer = document.getElementById("history-container");
    if (historyList.length === 0) {
        historyContainer.innerHTML = '<span class="history-empty">Nenhum personagem sorteado ainda.</span>';
        return;
    }

    historyContainer.innerHTML = "";
    historyList.forEach((char, index) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `<span>#${index + 1}</span> <span>${char.fallback} ${char.name}</span>`;
        historyContainer.appendChild(item);
    });
}

function toggleLock(id) {
    if (isDrawing) return;
    if (state[id].drawn) {
        state[id].drawn = false;
        state[id].locked = false;
        historyList = historyList.filter(item => item.id !== id);
    } else {
        state[id].locked = !state[id].locked;
    }
    playBeep(state[id].locked ? 220 : 587, 0.06);
    renderGrid();
}

function updateCounter() {
    const available = characters.filter(c => !state[c.id].drawn && !state[c.id].locked).length;
    document.getElementById("count-available").textContent = available;
    document.getElementById("btn-draw").disabled = (available === 0);
}

function sortear() {
    if (isDrawing) return;

    const pool = characters.filter(c => !state[c.id].drawn && !state[c.id].locked);
    if (pool.length === 0) return;

    isDrawing = true;
    document.getElementById("btn-draw").disabled = true;

    const totalSteps = 22 + Math.floor(Math.random() * 8);
    let currentStep = 0;
    let speed = 60;

    const chosen = pool[Math.floor(Math.random() * pool.length)];

    function step() {
        document.querySelectorAll(".card").forEach(c => c.classList.remove("highlight"));

        const randomVisualChar = characters[Math.floor(Math.random() * characters.length)];
        const targetCard = document.getElementById(`card-${randomVisualChar.id}`);
        if (targetCard) targetCard.classList.add("highlight");

        playBeep(300 + (currentStep * 15), 0.04);
        currentStep++;

        if (currentStep < totalSteps) {
            if (currentStep > totalSteps - 8) speed += 35;
            setTimeout(step, speed);
        } else {
            document.querySelectorAll(".card").forEach(c => c.classList.remove("highlight"));
            const winnerCard = document.getElementById(`card-${chosen.id}`);
            if (winnerCard) winnerCard.classList.add("highlight");

            state[chosen.id].drawn = true;
            historyList.push(chosen);

            playWinSound();

            try {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } catch(e) {}

            setTimeout(() => {
                isDrawing = false;
                renderGrid();
            }, 1200);
        }
    }

    step();
}

function resetarTudo() {
    if (isDrawing) return;
    characters.forEach(c => {
        state[c.id] = { drawn: false, locked: false };
    });
    historyList = [];
    playBeep(523.25, 0.1);
    renderGrid();
}

renderGrid();
