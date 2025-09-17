class ChiptuneAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isEnabled = true;
        this.sounds = {};
        
        this.init();
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Общая громкость
            
            this.createSounds();
        } catch (error) {
            console.log('Web Audio API не поддерживается');
            this.isEnabled = false;
        }
    }
    
    createSounds() {
        // Звук двигателя
        this.sounds.engine = () => this.createEngineSound();
        
        // Звук столкновения
        this.sounds.crash = () => this.createCrashSound();
        
        // Звук набора очков
        this.sounds.score = () => this.createScoreSound();
        
        // Фоновая музыка
        this.sounds.music = () => this.createBackgroundMusic();
    }
    
    createEngineSound() {
        if (!this.isEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    createCrashSound() {
        if (!this.isEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    createScoreSound() {
        if (!this.isEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    createBackgroundMusic() {
        if (!this.isEnabled) return;
        
        // Простая мелодия в стиле chiptune
        const notes = [
            { freq: 523, time: 0 },    // C5
            { freq: 659, time: 0.5 },  // E5
            { freq: 784, time: 1.0 },  // G5
            { freq: 659, time: 1.5 },  // E5
            { freq: 523, time: 2.0 },  // C5
            { freq: 440, time: 2.5 },  // A4
            { freq: 523, time: 3.0 },  // C5
            { freq: 659, time: 3.5 },  // E5
        ];
        
        notes.forEach(note => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime + note.time);
            
            gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime + note.time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.time + 0.4);
            
            oscillator.start(this.audioContext.currentTime + note.time);
            oscillator.stop(this.audioContext.currentTime + note.time + 0.4);
        });
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (this.isEnabled && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}
