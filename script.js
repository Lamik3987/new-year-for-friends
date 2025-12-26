// --- 1. КОНФИГУРАЦИЯ И ДАННЫЕ ---
const predictions = {
    arthur: ["В 2026 ты станешь легендой!", "Удача ждет тебя в марте.", "Меньше тильта, больше побед!", "Деньги придут неожиданно."],
    yuna: ["Путешествие мечты сбудется!", "Ты будешь сиять ярче всех.", "Жди приятный сюрприз.", "Карьера пойдет в гору."],
    vitya: ["Твой код будет идеальным.", "Грандиозный проект ждет тебя.", "Здоровье будет крепким.", "Ты найдешь то, что искал."],
    squad: ["Наша дружба станет крепче!", "Лучшая тусовка года впереди.", "Мы покорим новые вершины.", "Смеха будет в 2 раза больше."],
    // Данные Паши
    pasha: ["Всё будет... ну, нормально...", "Я устал, но ты держись...", "Может повезет, а может нет...", "Главное — выспаться...", "Посмотрим...", "Не сейчас...", "Звезды говорят... ничего..."]
};

// Переменные состояния
let currentPerson = null;
let isAnimating = false; // Блокировка интерфейса
let stormMode = false;   // Флаг бури
let hasSeenPashaIntro = false; // Флаг: видел ли пользователь интро Паши

// Переменные для интро Паши
const pashaPhrases = ["Паша....?", "Ох....", "Паша правда пришел...?", "Ну ладно...."];
let pashaPhase = 0;

// Элементы DOM (кэшируем для удобства)
const overlay = document.getElementById('pashaOverlay');
const overlayText = document.getElementById('pashaText');
const btn = document.getElementById('predictBtn');
const globeWrapper = document.getElementById('globeWrapper');
const text = document.getElementById('resultText');
const body = document.body;

// --- 2. ВЫБОР ПЕРСОНАЖА ---
function selectPerson(name) {
    if (isAnimating) return;
    currentPerson = name;
    
    // Подсветка кнопок
    document.querySelectorAll('.person-btn').forEach(btn => btn.classList.remove('active'));
    const btns = document.querySelectorAll('.person-btn');
    for (let b of btns) {
        if (b.getAttribute('onclick').includes(name)) {
            b.classList.add('active');
            break;
        }
    }

    // Скрываем старый результат при смене персонажа
    text.classList.remove('show');

    // Логика выбора
    if (name === 'pasha') {
        if (!hasSeenPashaIntro) {
            // Если Паша выбран первый раз -> Интро
            startPashaIntro();
            hasSeenPashaIntro = true; 
        } else {
            // Если уже видели -> Просто активируем кнопку
            btn.disabled = false;
        }
    } else {
        // Для всех остальных
        btn.disabled = false;
    }
}

// --- 3. ИНТРО ПАШИ ---
function startPashaIntro() {
    pashaPhase = 0;
    overlay.style.display = 'flex';
    setTimeout(() => showPashaText(pashaPhrases[0]), 100);
    btn.disabled = true; // Блокируем кнопку гадания на время интро
}

function showPashaText(txt) {
    overlayText.classList.remove('visible');
    setTimeout(() => {
        overlayText.innerText = txt;
        overlayText.classList.add('visible');
    }, 500);
}

// Обработчик клика по оверлею
if (overlay) {
    overlay.addEventListener('click', () => {
        pashaPhase++;
        if (pashaPhase < pashaPhrases.length) {
            showPashaText(pashaPhrases[pashaPhase]);
        } else {
            // Конец интро
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.style.opacity = '1';
                btn.disabled = false; // Разблокируем кнопку
            }, 500);
        }
    });
}

// --- 4. ЭПИЧНАЯ ЛОГИКА ПРЕДСКАЗАНИЯ ---
function makePrediction() {
    if (!currentPerson || isAnimating) return;
    isAnimating = true;
    
    // Блокируем интерфейс
    btn.disabled = true;
    text.classList.remove('show'); 
    
    // 1. ФАЗА: ФОКУС И ЗУМ (0s)
    body.classList.add('focus-mode');
    globeWrapper.classList.add('zoomed');

    // 2. ФАЗА: ТРЯСКА И БУРЯ (через 0.3s)
    setTimeout(() => {
        // !!! ИСПРАВЛЕНИЕ БАГА: Очищаем текст физически, чтобы старый не просвечивал
        text.innerText = ""; 
        
        globeWrapper.classList.add('shaking');
        stormMode = true; 
    }, 300);

    // 3. ФАЗА: ОСТАНОВКА И ВЫДАЧА (через 2.5s)
    setTimeout(() => {
        globeWrapper.classList.remove('shaking');
        stormMode = false; 
        
        // ВЕТВЛЕНИЕ ЛОГИКИ: ПАША vs ОСТАЛЬНЫЕ
        if (currentPerson === 'pasha') {
            // -- Логика Паши --
            text.classList.add('pasha-style'); // Холодный стиль
            text.innerText = "...";
            text.classList.add('show');

            // Пауза перед реальным ответом
            setTimeout(() => {
                text.classList.remove('show'); // Скрываем точки
                setTimeout(() => {
                    const list = predictions['pasha'];
                    const randomPhrase = list[Math.floor(Math.random() * list.length)];
                    text.innerText = randomPhrase + "..."; // Добавляем многоточие
                    text.classList.add('show');
                    endAnimation(); // Завершаем
                }, 500);
            }, 2000); // 2 секунды тишины

        } else {
            // -- Логика остальных --
            text.classList.remove('pasha-style'); // Убираем холодный стиль
            const list = predictions[currentPerson];
            text.innerText = list[Math.floor(Math.random() * list.length)];
            text.classList.add('show');
            endAnimation();
        }

    }, 2500);
}

// Вспомогательная функция завершения
function endAnimation() {
    // 4. ФАЗА: ВОЗВРАТ (еще через 2.5s на прочтение)
    setTimeout(() => {
        globeWrapper.classList.remove('zoomed');
        body.classList.remove('focus-mode');
        isAnimating = false;
        btn.disabled = false;
    }, 2500);
}

// --- 5. ДВИЖОК СНЕГА (CANVAS + PHYSICS) ---
try {
    const canvas = document.getElementById('snowCanvas');
    const ctx = canvas.getContext('2d');
    const GLOBE_SIZE = 400; // Размер шара (должен совпадать с CSS)
    const RADIUS = GLOBE_SIZE / 2;
    
    canvas.width = GLOBE_SIZE; 
    canvas.height = GLOBE_SIZE;

    let particles = [];

    class Snowflake {
        constructor() { this.reset(true); }
        
        reset(initial = false) {
            let valid = false;
            let safety = 0;
            // Спавним снег только внутри круга
            while (!valid && safety < 100) {
                this.x = Math.random() * GLOBE_SIZE;
                this.y = initial ? Math.random() * GLOBE_SIZE : -10;
                const dx = this.x - RADIUS; 
                const dy = this.y - RADIUS;
                // Условие круга с небольшим отступом
                if (dx*dx + dy*dy < (RADIUS - 15) * (RADIUS - 15)) valid = true;
                safety++;
            }
            this.size = Math.random() * 3 + 1; 
            this.baseSpeed = Math.random() * 1.5 + 0.5;
            this.vx = 0; 
            this.vy = 0; 
            this.angle = Math.random() * Math.PI * 2;
            this.opacity = Math.random() * 0.6 + 0.2;
        }

        update() {
            if (stormMode) {
                // БУРЯ: Хаос и скорость
                this.vx += (Math.random() - 0.5) * 4; 
                this.vy += (Math.random() - 0.5) * 4;
                
                const maxSpeed = 15;
                this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
                this.vy = Math.max(-maxSpeed, Math.min(maxSpeed, this.vy));
                
                this.x += this.vx;
                this.y += this.vy;

                // Отскок от стенок
                const dx = this.x - RADIUS;
                const dy = this.y - RADIUS;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist > RADIUS - 5) {
                    this.vx *= -0.8; 
                    this.vy *= -0.8;
                    // Возврат внутрь
                    const angle = Math.atan2(dy, dx);
                    this.x = RADIUS + Math.cos(angle) * (RADIUS - 10);
                    this.y = RADIUS + Math.sin(angle) * (RADIUS - 10);
                }
            } else {
                // СПОКОЙСТВИЕ: Гравитация
                this.vx *= 0.95;
                if (this.vy < this.baseSpeed) this.vy += 0.1;
                
                this.x += Math.sin(this.angle) * 0.5 + this.vx;
                this.y += this.vy;
                this.angle += 0.05;

                // Респавн при падении
                const dx = this.x - RADIUS;
                const dy = this.y - RADIUS;
                if (Math.sqrt(dx*dx + dy*dy) > RADIUS - 5 || this.y > GLOBE_SIZE) {
                    if (this.y > RADIUS) this.reset(false);
                }
            }
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
            ctx.fill();
        }
    }

    function initSnow() {
        particles = []; 
        for (let i = 0; i < 250; i++) particles.push(new Snowflake());
    }

    function animate() {
        ctx.clearRect(0, 0, GLOBE_SIZE, GLOBE_SIZE);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    initSnow(); 
    animate();
} catch (e) {
    console.error("Snow animation failed:", e);
}