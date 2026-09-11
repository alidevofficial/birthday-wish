/* ============================================================
   BIRTHDAY SURPRISE APP - ADVANCED JAVASCRIPT & FEATURES
   ============================================================ */

const CORRECT_PASSCODE = "1109";
let currentInput = "";
let typewriterInterval = null;
let isAudioPlaying = false;
let hugCount = 0;
let candlesBlown = false;

// Web Audio API Synthesizer Context
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Sound Synthesizers for UI feedback
function playClickSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch(e) {}
}

function playSuccessChime() {
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.1);
            osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
        });
    } catch(e) {}
}

function playWrongSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch(e) {}
}

function playBlowSound() {
    try {
        const ctx = getAudioContext();
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    } catch(e) {}
}

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    initMusicControl();
    initRunawayNoButton();
    updateDots();
});

/* ------------------------------------------------------------
   AUDIO CONTROL & MUSIC TOGGLE
   ------------------------------------------------------------ */
function initMusicControl() {
    let musicBtn = document.getElementById("music-toggle-btn");
    if (musicBtn) {
        musicBtn.onclick = toggleMusic;
    }
}

function toggleMusic() {
    const music = document.getElementById("bg-music");
    const musicBtn = document.getElementById("music-toggle-btn");
    if (!music) return;

    if (music.paused) {
        music.play().then(() => {
            isAudioPlaying = true;
            if (musicBtn) musicBtn.innerHTML = "🎶";
        }).catch(err => {
            console.log("Autoplay blocked:", err);
        });
    } else {
        music.pause();
        isAudioPlaying = false;
        if (musicBtn) musicBtn.innerHTML = "🎵";
    }
}

function playMusicIfPossible() {
    const music = document.getElementById("bg-music");
    const musicBtn = document.getElementById("music-toggle-btn");
    if (music && music.paused) {
        music.play().then(() => {
            isAudioPlaying = true;
            if (musicBtn) musicBtn.innerHTML = "🎶";
        }).catch(err => console.log("Audio waiting for user gesture:", err));
    }
}

/* ------------------------------------------------------------
   THEME SWITCHER (DARK / LIGHT MODE)
   ------------------------------------------------------------ */
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById("theme-toggle-btn");
    body.classList.toggle("dark-mode");

    if (body.classList.contains("dark-mode")) {
        if (themeBtn) themeBtn.innerHTML = "☀️";
    } else {
        if (themeBtn) themeBtn.innerHTML = "🌙";
    }
    playClickSound();
}

/* ------------------------------------------------------------
   PASSCODE HINT MODAL
   ------------------------------------------------------------ */
function showHint() {
    const modal = document.getElementById("hint-modal");
    if (modal) {
        modal.classList.add("active");
    }
    playClickSound();
}

function closeHint() {
    const modal = document.getElementById("hint-modal");
    if (modal) {
        modal.classList.remove("active");
    }
    playClickSound();
}

/* ------------------------------------------------------------
   PASSCODE KEYPAD LOGIC
   ------------------------------------------------------------ */
function pressKey(num) {
    if (currentInput.length < 4) {
        currentInput += num;
        updateDots();
        playClickSound();
        
        if (navigator.vibrate) {
            navigator.vibrate(40);
        }
    }
}

function updateDots() {
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) {
            if (i < currentInput.length) {
                dot.innerText = "●";
                dot.classList.add("filled");
            } else {
                dot.innerText = "";
                dot.classList.remove("filled");
            }
        }
    }
}

function checkPasscode() {
    const card = document.querySelector(".card");

    if (currentInput === CORRECT_PASSCODE) {
        playSuccessChime();
        playMusicIfPossible();
        goToScreen('screen-question');
    } else {
        playWrongSound();
        if (card) {
            card.classList.add("shake");
            setTimeout(() => card.classList.remove("shake"), 450);
        }
        goToScreen('screen-wrong');
    }
    currentInput = "";
    updateDots();
}

/* ------------------------------------------------------------
   SCREEN ROUTING & TRANSITIONS
   ------------------------------------------------------------ */
function goToScreen(screenId) {
    playClickSound();
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (screenId === 'screen-birthday') {
        triggerConfetti();
        startTypewriterTitle("HAPPY BIRTHDAY 🎉");
    } else if (screenId === 'screen-proposal') {
        initRunawayNoButton();
    }
}

/* ------------------------------------------------------------
   FEATURE: CANDLE BLOWING MINI-GAME
   ------------------------------------------------------------ */
function blowCandles() {
    if (candlesBlown) return;

    playBlowSound();
    const flames = document.querySelectorAll('.candle-flame');
    flames.forEach((flame, index) => {
        setTimeout(() => {
            flame.classList.add('out');
        }, index * 150);
    });

    const blowHint = document.getElementById('blow-hint');
    if (blowHint) {
        blowHint.innerText = "✨ Make a Wish! Your Wish Will Come True! 💫";
        blowHint.style.color = "#4caf50";
    }

    candlesBlown = true;
    triggerConfetti();
}

/* ------------------------------------------------------------
   FEATURE: HUG COUNTER
   ------------------------------------------------------------ */
function sendHug() {
    hugCount++;
    playSuccessChime();
    
    const countBadge = document.getElementById("hug-count-num");
    if (countBadge) {
        countBadge.innerText = hugCount;
    }

    // Burst mini floating hearts around hug button
    for (let i = 0; i < 6; i++) {
        createHeart();
    }

    if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
    }
}

/* ------------------------------------------------------------
   FLOATING PINK HEARTS GENERATOR
   ------------------------------------------------------------ */
function createHeart() {
    const container = document.getElementById('hearts-container');
    if (!container) return;

    if (container.children.length > 25) return;

    const heart = document.createElement('div');
    heart.classList.add('heart-particle');
    
    const heartTypes = ['💗', '💖', '💝', '🌸', '✨', '💕', '🌹'];
    heart.innerText = heartTypes[Math.floor(Math.random() * heartTypes.length)];

    heart.style.left = Math.random() * 95 + 'vw';
    heart.style.fontSize = Math.random() * 10 + 12 + 'px';
    
    const duration = Math.random() * 3 + 4;
    heart.style.animationDuration = duration + 's';

    container.appendChild(heart);
    setTimeout(() => {
        heart.remove();
    }, duration * 1000);
}
setInterval(createHeart, 350);

/* ------------------------------------------------------------
   CONFETTI EXPLOSION EFFECT
   ------------------------------------------------------------ */
function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    container.innerHTML = ''; 
    const colors = ['#ff4081', '#ffeb3b', '#00e676', '#00b0ff', '#aa00ff', '#ff5722', '#ff80ab'];

    for (let i = 0; i < 90; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        
        sparkle.style.top = '50%';
        sparkle.style.left = '50%';
        sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 350 + 100;
        const x = Math.cos(angle) * velocity + 'px';
        const y = Math.sin(angle) * velocity + 'px';
        
        sparkle.style.setProperty('--x', x);
        sparkle.style.setProperty('--y', y);

        container.appendChild(sparkle);
        setTimeout(() => {
            sparkle.remove();
        }, 1500);
    }
}

/* ------------------------------------------------------------
   TYPEWRITER EFFECT FOR BIRTHDAY TITLE
   ------------------------------------------------------------ */
function startTypewriterTitle(text) {
    const el = document.getElementById("typewriter-title");
    if (!el) return;

    el.innerHTML = "";
    el.classList.add("cursor");
    let i = 0;
    clearInterval(typewriterInterval);
    
    typewriterInterval = setInterval(() => {
        if (i < text.length) {
            el.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typewriterInterval);
            el.classList.remove("cursor");
        }
    }, 120);
}

/* ------------------------------------------------------------
   RUNAWAY "NO" BUTTON ON PROPOSAL SCREEN
   ------------------------------------------------------------ */
function initRunawayNoButton() {
    const proposalScreen = document.getElementById("screen-proposal");
    if (!proposalScreen) return;

    const noBtn = proposalScreen.querySelector(".btn-no");
    if (!noBtn) return;

    const dodgeNo = (e) => {
        const btnGroup = noBtn.parentElement;
        if (!btnGroup) return;

        const groupRect = btnGroup.getBoundingClientRect();
        const maxX = Math.max(40, groupRect.width - 100);
        const maxY = 60;

        const randomX = (Math.random() - 0.5) * maxX * 1.5;
        const randomY = (Math.random() - 0.5) * maxY * 1.5;

        noBtn.style.position = "relative";
        noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
    };

    noBtn.onmouseenter = dodgeNo;
    noBtn.ontouchstart = (e) => {
        dodgeNo(e);
        e.preventDefault();
    };
}

/* ------------------------------------------------------------
   PROPOSAL VICTORY CELEBRATION MODAL
   ------------------------------------------------------------ */
function handleProposalYes() {
    playSuccessChime();
    triggerConfetti();
    
    const modal = document.getElementById("celebration-modal");
    if (modal) {
        modal.classList.add("active");
    }
}

function closeCelebrationModal() {
    const modal = document.getElementById("celebration-modal");
    if (modal) {
        modal.classList.remove("active");
    }
    playClickSound();
}
