/* ============================================
   НАСТРОЙКИ — меняйте здесь
   ============================================ */
const SLIDE_DURATION  = 10400;      // длительность обычного слайда (мс) = 10.4 сек
const FINAL_DURATION  = 15000;      // длительность финального текстового слайда (мс) = 15 сек
const AUDIO_SRC       = 'audio/song.mp3';
const FADE_OUT_BEFORE = 3500;       // за сколько мс до конца песни начать затухание

/* ============================================
   ЛОГИКА
   ============================================ */

const showEl    = document.getElementById('show');
const playBtn   = document.getElementById('playBtn');
const audio     = document.getElementById('audio');
const slidesEls = Array.from(document.querySelectorAll('.slide'));
const TOTAL     = slidesEls.length;

let currentIndex = 0;
let slideTimer   = null;
let fadeTimer    = null;
let isPlaying    = false;
let fadeStarted  = false;

/* --- Показать слайд по индексу --- */
function showSlide(index) {
    slidesEls.forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });
}

/* --- Плавное затухание музыки --- */
function startFadeOut() {
    if (fadeStarted) return;
    fadeStarted = true;

    const startVolume = audio.volume;
    const startTime   = performance.now();

    function step(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / FADE_OUT_BEFORE, 1);
        audio.volume   = startVolume * (1 - progress);

        if (progress < 1 && !audio.paused) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

/* --- Таймер переключения слайдов --- */
function startSlideTimer() {
    clearTimeout(slideTimer);

    const duration = (currentIndex === TOTAL - 1)
        ? FINAL_DURATION
        : SLIDE_DURATION;

    slideTimer = setTimeout(() => {
        if (!isPlaying) return;

        if (currentIndex < TOTAL - 1) {
            currentIndex++;
            showSlide(currentIndex);
            startSlideTimer();
        } else {
            onShowEnd();
        }
    }, duration);
}

/* --- Планировщик fade-out по музыке --- */
function scheduleFadeOut() {
    clearTimeout(fadeTimer);
    fadeStarted = false;
    audio.volume = 1;

    // Если метаданные ещё не подгрузились — ждём
    if (!isFinite(audio.duration) || audio.duration === 0) {
        audio.addEventListener('loadedmetadata', scheduleFadeOut, { once: true });
        return;
    }

    const fadeAt = Math.max(0, (audio.duration * 1000) - FADE_OUT_BEFORE);
    fadeTimer = setTimeout(startFadeOut, fadeAt);
}

/* --- Запуск --- */
function play() {
    isPlaying = true;
    playBtn.classList.add('hidden');

    // Если начинаем сначала — сбрасываем громкость
    if (audio.currentTime === 0) {
        audio.volume = 1;
        fadeStarted = false;
    }

    audio.play().catch(err => console.warn('Audio play error:', err));
    scheduleFadeOut();
    startSlideTimer();
}

/* --- Пауза --- */
function pause() {
    isPlaying = false;
    clearTimeout(slideTimer);
    clearTimeout(fadeTimer);
    audio.pause();
    playBtn.classList.remove('hidden');
}

/* --- Конец шоу --- */
function onShowEnd() {
    isPlaying = false;
    clearTimeout(slideTimer);
    clearTimeout(fadeTimer);
    playBtn.classList.remove('hidden');
}

/* --- Полный сброс --- */
function resetShow() {
    currentIndex = 0;
    audio.currentTime = 0;
    audio.volume = 1;
    fadeStarted = false;
    clearTimeout(fadeTimer);
    showSlide(0);
}

/* --- Клик по кнопке Play --- */
playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentIndex >= TOTAL - 1) resetShow();
    play();
});

/* --- Клик по экрану --- */
showEl.addEventListener('click', (e) => {
    if (e.target.closest('.play-btn')) return;

    if (isPlaying) {
        pause();
    } else {
        if (currentIndex >= TOTAL - 1) resetShow();
        play();
    }
});

/* --- Инициализация --- */
window.addEventListener('load', () => {
    showSlide(0);
    audio.src = AUDIO_SRC;
    audio.volume = 1;
});