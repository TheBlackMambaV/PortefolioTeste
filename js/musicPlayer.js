// Sistema global de música para persistência entre páginas
class MusicPlayer {
    constructor() {
        this.audioPlayer = null;
        this.isPlaying = false;
        this.currentTrack = 'rap';
        this.currentTime = 0;
        this.volume = 0.7;
        this.progress = 35;
        this.isInitialized = false;
        
        this.themeMusic = {
            rap: { title: 'Track 1', artist: 'RAP', file: 'music/rap.mp3' },
            classico: { title: 'Track 1', artist: 'CLÁSSICO', file: 'music/classico.mp3' },
            lofi: { title: 'Track 1', artist: 'LOFI', file: 'music/lofi.mp3' },
            metal: { title: 'Track 1', artist: 'METAL', file: 'music/metal.mp3' }
        };
        
        // Inicializar imediatamente
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.loadState();
        this.createAudioPlayer();
        this.restoreState();
        this.isInitialized = true;
        
        console.log('MusicPlayer initialized');
    }
    
    createAudioPlayer() {
        // Verificar se já existe um player
        this.audioPlayer = document.getElementById('globalAudioPlayer');
        if (!this.audioPlayer) {
            this.audioPlayer = document.createElement('audio');
            this.audioPlayer.id = 'globalAudioPlayer';
            this.audioPlayer.style.display = 'none';
            document.body.appendChild(this.audioPlayer);
        }
        
        // Limpar event listeners antigos
        const newPlayer = this.audioPlayer.cloneNode();
        this.audioPlayer.parentNode.replaceChild(newPlayer, this.audioPlayer);
        this.audioPlayer = newPlayer;
        
        // Event listeners
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioPlayer.addEventListener('ended', () => this.onEnded());
        this.audioPlayer.addEventListener('error', (e) => console.warn('Audio loading error:', e));
        
        // Definir volume inicial
        this.audioPlayer.volume = this.volume;
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('musicPlayerState');
            if (saved) {
                const state = JSON.parse(saved);
                this.isPlaying = state.isPlaying || false;
                this.currentTrack = state.currentTrack || 'rap';
                this.currentTime = state.currentTime || 0;
                this.volume = state.volume || 0.7;
                this.progress = state.progress || 35;
            }
        } catch (e) {
            console.warn('Failed to load music player state:', e);
        }
    }
    
    saveState() {
        try {
            const state = {
                isPlaying: this.isPlaying,
                currentTrack: this.currentTrack,
                currentTime: this.currentTime,
                volume: this.volume,
                progress: this.progress
            };
            localStorage.setItem('musicPlayerState', JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save music player state:', e);
        }
    }
    
    restoreState() {
        if (this.themeMusic[this.currentTrack]) {
            this.audioPlayer.src = this.themeMusic[this.currentTrack].file;
            
            // Restaurar posição quando o áudio estiver pronto
            const onLoadedData = () => {
                if (this.currentTime > 0 && this.currentTime < this.audioPlayer.duration) {
                    this.audioPlayer.currentTime = this.currentTime;
                }
                
                // Restaurar estado de reprodução
                if (this.isPlaying) {
                    this.audioPlayer.play().catch(e => {
                        console.warn('Could not auto-play audio:', e);
                        this.isPlaying = false;
                    });
                }
                
                // Atualizar UI
                this.updateUI();
            };
            
            this.audioPlayer.addEventListener('loadeddata', onLoadedData, { once: true });
        }
    }
    
    updateTrack(theme, forceRestart = false) {
        if (!this.themeMusic[theme]) return;
        
        const isThemeChange = this.currentTrack !== theme;
        
        if (isThemeChange) {
            // Mudança de tema - parar música e recomeçar
            const wasPlaying = this.isPlaying;
            
            this.currentTrack = theme;
            this.currentTime = 0;
            this.progress = 0;
            
            this.audioPlayer.src = this.themeMusic[theme].file;
            this.audioPlayer.currentTime = 0;
            
            // Parar reprodução ao mudar de tema
            this.pause();
            
            // Atualizar UI
            this.updateUI();
            
            this.saveState();
        } else if (forceRestart) {
            // Forçar reinício (usado apenas para temas)
            this.audioPlayer.currentTime = 0;
            this.pause();
            this.updateUI();
            this.saveState();
        }
        // Se não for mudança de tema e não for forceRestart, não fazer nada
        // para manter a música a tocar
    }
    
    getCurrentTrack() {
        return this.themeMusic[this.currentTrack] || this.themeMusic.rap;
    }
    
    play() {
        if (this.audioPlayer.src) {
            this.audioPlayer.play().then(() => {
                this.isPlaying = true;
                this.updateUI();
                this.saveState();
            }).catch(e => {
                console.warn('Play failed:', e);
                this.isPlaying = false;
                this.updateUI();
            });
        }
    }
    
    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.updateUI();
        this.saveState();
    }
    
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    seek(percentage) {
        if (this.audioPlayer.duration) {
            this.audioPlayer.currentTime = (percentage / 100) * this.audioPlayer.duration;
            this.currentTime = this.audioPlayer.currentTime;
            this.progress = percentage;
            this.updateUI();
            this.saveState();
        }
    }
    
    setVolume(percentage) {
        this.volume = Math.max(0, Math.min(1, percentage));
        this.audioPlayer.volume = this.volume;
        this.updateUI();
        this.saveState();
    }
    
    updateProgress() {
        if (this.audioPlayer.duration) {
            this.progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.currentTime = this.audioPlayer.currentTime;
            
            // Atualizar UI em tempo real
            this.updateProgressUI();
            this.saveState();
        }
    }
    
    updateProgressUI() {
        const progressFill = document.getElementById('progressFill');
        const currentTimeDisplay = document.querySelector('.time');
        
        if (progressFill) {
            progressFill.style.width = this.progress + '%';
        }
        
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
    }
    
    updateDuration() {
        const durationDisplay = document.querySelectorAll('.time')[1];
        if (durationDisplay && this.audioPlayer.duration) {
            durationDisplay.textContent = this.formatTime(this.audioPlayer.duration);
        }
    }
    
    onEnded() {
        this.isPlaying = false;
        this.progress = 0;
        this.currentTime = 0;
        
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = '▶';
        }
        
        this.saveState();
    }
    
    updateUI() {
        const trackTitle = document.getElementById('trackTitle');
        const trackArtist = document.getElementById('trackArtist');
        const playBtn = document.getElementById('playBtn');
        
        const track = this.getCurrentTrack();
        
        if (trackTitle) trackTitle.textContent = track.title;
        if (trackArtist) trackArtist.textContent = track.artist;
        if (playBtn) playBtn.textContent = this.isPlaying ? '⏸' : '▶';
        
        // Atualizar barra de progresso
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = this.progress + '%';
        }
        
        // Atualizar volume
        const volumeFill = document.getElementById('volumeFill');
        if (volumeFill) {
            volumeFill.style.width = (this.volume * 100) + '%';
        }
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

// Criar instância global imediatamente
window.musicPlayer = new MusicPlayer();
