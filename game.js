class SpaceDriftGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Игровые состояния
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.gameSpeed = 1;
        this.lastTime = 0;
        this.highScore = localStorage.getItem('spaceDriftHighScore') || 0;
        
        // Космический корабль
        this.spaceship = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 20,
            height: 30,
            speed: 5,
            color: '#00ff00'
        };
        
        // Астероиды
        this.asteroids = [];
        this.asteroidSpawnRate = 0.02;
        this.lastAsteroidSpawn = 0;
        
        // Звезды для фона
        this.stars = this.generateStars(100);
        
        // Частицы
        this.particles = [];
        
        // Управление
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };
        
        // Аудио
        this.audio = new ChiptuneAudio();
        this.lastEngineSound = 0;
        
        this.init();
        this.updateHighScoreDisplay();
    }
    
    init() {
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            // Пауза на пробел
            if (e.code === 'Space' && this.gameState === 'playing') {
                this.pauseGame();
            } else if (e.code === 'Space' && this.gameState === 'paused') {
                this.resumeGame();
            }
        });
        
        // Мышь
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.isDown = true;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });
        
        // Кнопки
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Кнопка звука
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.audio.toggle();
            const soundBtn = document.getElementById('soundToggle');
            soundBtn.textContent = this.audio.isEnabled ? '🔊' : '🔇';
        });
    }
    
    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
        return stars;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameSpeed = 1;
        this.asteroids = [];
        this.spaceship.x = this.canvas.width / 2;
        this.spaceship.y = this.canvas.height - 80;
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        // Запуск фоновой музыки
        this.audio.play('music');
    }
    
    restartGame() {
        this.startGame();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('gameOverlay').style.display = 'flex';
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        // Создаем экран паузы
        let pauseScreen = document.getElementById('pauseScreen');
        if (!pauseScreen) {
            pauseScreen = document.createElement('div');
            pauseScreen.id = 'pauseScreen';
            pauseScreen.className = 'start-screen';
            pauseScreen.innerHTML = `
                <h2>ПАУЗА</h2>
                <p>Нажмите ПРОБЕЛ для продолжения</p>
                <button id="resumeBtn" class="retro-btn">ПРОДОЛЖИТЬ</button>
            `;
            document.getElementById('gameOverlay').appendChild(pauseScreen);
            
            document.getElementById('resumeBtn').addEventListener('click', () => {
                this.resumeGame();
            });
        }
        pauseScreen.style.display = 'block';
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('gameOverlay').style.display = 'none';
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'block';
        
        // Обновление рекорда
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceDriftHighScore', this.highScore);
        }
        
        // Звук столкновения
        this.audio.play('crash');
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.updateSpaceship();
        this.updateAsteroids(deltaTime);
        this.updateStars(deltaTime);
        this.updateParticles(deltaTime);
        this.checkCollisions();
        this.updateScore();
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    updateSpaceship() {
        // Управление клавиатурой
        if (this.keys['ArrowLeft'] && this.spaceship.x > 0) {
            this.spaceship.x -= this.spaceship.speed;
        }
        if (this.keys['ArrowRight'] && this.spaceship.x < this.canvas.width - this.spaceship.width) {
            this.spaceship.x += this.spaceship.speed;
        }
        if (this.keys['ArrowUp'] && this.spaceship.y > 0) {
            this.spaceship.y -= this.spaceship.speed;
        }
        if (this.keys['ArrowDown'] && this.spaceship.y < this.canvas.height - this.spaceship.height) {
            this.spaceship.y += this.spaceship.speed;
        }
        
        // Управление мышью
        if (this.mouse.isDown) {
            const targetX = this.mouse.x - this.spaceship.width / 2;
            const targetY = this.mouse.y - this.spaceship.height / 2;
            
            this.spaceship.x += (targetX - this.spaceship.x) * 0.1;
            this.spaceship.y += (targetY - this.spaceship.y) * 0.1;
            
            // Ограничения
            this.spaceship.x = Math.max(0, Math.min(this.canvas.width - this.spaceship.width, this.spaceship.x));
            this.spaceship.y = Math.max(0, Math.min(this.canvas.height - this.spaceship.height, this.spaceship.y));
        }
        
        // Звук двигателя при движении
        const currentTime = Date.now();
        if ((this.keys['ArrowLeft'] || this.keys['ArrowRight'] || this.keys['ArrowUp'] || this.keys['ArrowDown'] || this.mouse.isDown) && 
            currentTime - this.lastEngineSound > 100) {
            this.audio.play('engine');
            this.lastEngineSound = currentTime;
        }
    }
    
    updateAsteroids(deltaTime) {
        // Создание новых астероидов
        if (Math.random() < this.asteroidSpawnRate * this.gameSpeed) {
            this.createAsteroid();
        }
        
        // Обновление существующих астероидов
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.y += asteroid.speed * this.gameSpeed;
            
            // Удаление астероидов, вышедших за экран
            if (asteroid.y > this.canvas.height) {
                this.asteroids.splice(i, 1);
                this.score += 10; // Очки за пролетевший астероид
                this.audio.play('score'); // Звук набора очков
            }
        }
    }
    
    createAsteroid() {
        const size = Math.random() * 20 + 15;
        this.asteroids.push({
            x: Math.random() * (this.canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: Math.random() * 3 + 2,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
    
    updateStars(deltaTime) {
        this.stars.forEach(star => {
            star.y += star.speed * this.gameSpeed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    }
    
    updateParticles(deltaTime) {
        // Создание частиц от двигателей корабля
        if (Math.random() < 0.3) {
            this.createEngineParticle();
        }
        
        // Обновление существующих частиц
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.size *= 0.98;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    createEngineParticle() {
        const engineX = this.spaceship.x + this.spaceship.width / 2;
        const engineY = this.spaceship.y + this.spaceship.height;
        
        this.particles.push({
            x: engineX + (Math.random() - 0.5) * 10,
            y: engineY,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 3 + 2,
            size: Math.random() * 3 + 1,
            life: 1,
            color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00'
        });
    }
    
    checkCollisions() {
        for (const asteroid of this.asteroids) {
            if (this.isColliding(this.spaceship, asteroid)) {
                this.gameOver();
                return;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        // Увеличение сложности
        this.gameSpeed = 1 + Math.floor(this.score / 1000) * 0.2;
        this.asteroidSpawnRate = 0.02 + Math.floor(this.score / 2000) * 0.01;
    }
    
    render() {
        // Очистка canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рендер звезд
        this.renderStars();
        
        if (this.gameState === 'playing') {
            // Рендер частиц
            this.renderParticles();
            
            // Рендер космического корабля
            this.renderSpaceship();
            
            // Рендер астероидов
            this.renderAsteroids();
        }
    }
    
    renderStars() {
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1;
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            this.ctx.restore();
        });
    }
    
    renderSpaceship() {
        this.ctx.save();
        this.ctx.translate(this.spaceship.x + this.spaceship.width / 2, this.spaceship.y + this.spaceship.height / 2);
        
        // Пиксель-арт космический корабль
        const w = this.spaceship.width;
        const h = this.spaceship.height;
        
        // Основной корпус
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(-w/2, -h/2, w, h);
        
        // Кабина пилота
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, 6);
        
        // Детали корпуса
        this.ctx.fillStyle = '#00cc00';
        this.ctx.fillRect(-w/2 + 1, -h/2 + 8, w - 2, 2);
        this.ctx.fillRect(-w/2 + 1, -h/2 + 12, w - 2, 2);
        
        // Крылья
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(-w/2 - 4, -h/2 + 6, 4, 8);
        this.ctx.fillRect(w/2, -h/2 + 6, 4, 8);
        
        // Двигатели (с анимацией)
        const engineGlow = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(255, 102, 0, ${engineGlow})`;
        this.ctx.fillRect(-3, h/2 - 2, 6, 6);
        this.ctx.fillRect(-w/2 + 2, h/2 - 2, 4, 6);
        this.ctx.fillRect(w/2 - 6, h/2 - 2, 4, 6);
        
        // Свечение двигателей
        this.ctx.fillStyle = `rgba(255, 200, 0, ${engineGlow * 0.5})`;
        this.ctx.fillRect(-2, h/2 + 4, 4, 3);
        this.ctx.fillRect(-w/2 + 3, h/2 + 4, 2, 3);
        this.ctx.fillRect(w/2 - 5, h/2 + 4, 2, 3);
        
        this.ctx.restore();
    }
    
    renderAsteroids() {
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
            this.ctx.rotate(asteroid.rotation);
            
            const w = asteroid.width;
            const h = asteroid.height;
            
            // Пиксель-арт астероид
            // Основной корпус
            this.ctx.fillStyle = '#444444';
            this.ctx.fillRect(-w/2, -h/2, w, h);
            
            // Детали поверхности
            this.ctx.fillStyle = '#666666';
            this.ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, h - 4);
            
            // Кратеры и неровности
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(-w/2 + 4, -h/2 + 4, 3, 3);
            this.ctx.fillRect(w/2 - 7, -h/2 + 6, 2, 2);
            this.ctx.fillRect(-w/2 + 6, h/2 - 7, 2, 2);
            this.ctx.fillRect(w/2 - 5, h/2 - 5, 3, 3);
            
            // Световые блики
            this.ctx.fillStyle = '#888888';
            this.ctx.fillRect(-w/2 + 1, -h/2 + 1, 2, 2);
            this.ctx.fillRect(w/2 - 3, -h/2 + 3, 2, 1);
            
            // Свечение при движении
            const glow = Math.sin(asteroid.rotation * 2) * 0.2 + 0.8;
            this.ctx.fillStyle = `rgba(100, 100, 100, ${glow * 0.3})`;
            this.ctx.fillRect(-w/2 - 1, -h/2 - 1, w + 2, h + 2);
            
            this.ctx.restore();
            
            asteroid.rotation += asteroid.rotationSpeed;
        });
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    new SpaceDriftGame();
});
