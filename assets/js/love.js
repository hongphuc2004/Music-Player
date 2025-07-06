class FavoriteMusicPlayer {
    constructor() {
        this.allSongs = [];
        this.favoriteSongs = [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.currentSort = 'name';
        
        this.audioPlayer = document.getElementById('audio-player');
        this.favoritesListEl = document.getElementById('favorites-list');
        this.emptyStateEl = document.getElementById('empty-state');
        this.favoriteCountEl = document.getElementById('favorite-count');
        
        // Player panel elements
        this.albumArt = document.getElementById('album-art');
        this.songTitle = document.getElementById('current-song-title');
        this.songArtist = document.getElementById('current-song-artist');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        this.noMusicPlaceholder = document.getElementById('no-music-placeholder');
        
        this.init();
    }
    
    async init() {
        await this.loadAllSongs();
        this.loadFavoriteSongs();
        this.renderFavorites();
        this.bindEvents();
    }
    
    async loadAllSongs() {
        try {
            const response = await fetch('../Music.json');
            this.allSongs = await response.json();
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    }
    
    loadFavoriteSongs() {
        this.favoriteSongs = this.allSongs.filter(song => 
            this.favorites.includes(song.name)
        );
        
        // Add timestamp for sorting
        this.favoriteSongs = this.favoriteSongs.map(song => ({
            ...song,
            addedDate: new Date().toISOString()
        }));
        
        this.updateFavoriteCount();
    }
    
    updateFavoriteCount() {
        const count = this.favoriteSongs.length;
        this.favoriteCountEl.textContent = `${count} bài hát`;
    }
    
    renderFavorites() {
        if (this.favoriteSongs.length === 0) {
            this.favoritesListEl.innerHTML = '';
            this.emptyStateEl.style.display = 'block';
            return;
        }
        
        this.emptyStateEl.style.display = 'none';
        
        // Sort songs based on current sort option
        this.sortSongs();
        
        this.favoritesListEl.innerHTML = '';
        
        this.favoriteSongs.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.className = `favorite-song-item ${index === this.currentSongIndex ? 'playing' : ''}`;
            songItem.innerHTML = `
                <div class="favorite-song-number">${index + 1}</div>
                <img src="../${song.image}" alt="${song.name}" onerror="this.src='../img/Reality.jpg'">
                <div class="favorite-song-info">
                    <div class="favorite-song-title">${song.name}</div>
                    <div class="favorite-song-artist">${song.singer}</div>
                </div>
                <div class="favorite-song-duration">3:24</div>
                <div class="favorite-song-actions">
                    <button class="favorite-action-btn play-btn" title="Phát" data-index="${index}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="favorite-action-btn remove" title="Xóa khỏi yêu thích" data-song-name="${song.name}">
                        <i class="fas fa-heart-broken"></i>
                    </button>
                </div>
            `;
            
            // Add click event for entire item
            songItem.addEventListener('click', (e) => {
                if (!e.target.closest('.favorite-song-actions')) {
                    this.playSong(index);
                }
            });
            
            this.favoritesListEl.appendChild(songItem);
        });
        
        // Add event listeners for action buttons
        this.bindActionButtons();
    }
    
    bindActionButtons() {
        // Play buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.playSong(index);
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.favorite-action-btn.remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songName = btn.dataset.songName;
                this.removeFromFavorites(songName);
            });
        });
    }
    
    bindEvents() {
        // Sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSort = btn.dataset.sort;
                this.renderFavorites();
            });
        });
        
        // Play all button
        document.getElementById('play-all-btn').addEventListener('click', () => {
            if (this.favoriteSongs.length > 0) {
                this.playSong(0);
            }
        });
        
        // Clear all button
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAllFavorites();
        });
        
        // Player controls
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        this.prevBtn.addEventListener('click', () => {
            this.previousSong();
        });
        
        this.nextBtn.addEventListener('click', () => {
            this.nextSong();
        });
        
        // Audio events
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateProgress();
        });
        
        this.audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
        });
        
        this.audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            this.nextSong();
        });
        
        // Progress bar
        this.progressBar.addEventListener('input', () => {
            const seekTime = (this.progressBar.value / 100) * this.audioPlayer.duration;
            this.audioPlayer.currentTime = seekTime;
        });
    }
    
    sortSongs() {
        switch (this.currentSort) {
            case 'name':
                this.favoriteSongs.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'artist':
                this.favoriteSongs.sort((a, b) => a.singer.localeCompare(b.singer));
                break;
            case 'date':
                this.favoriteSongs.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
                break;
        }
    }
    
    updatePlayerBackground(imagePath) {
        // Chuyển đổi đường dẫn relative nếu cần
        let fullPath = imagePath;
        if (imagePath && !imagePath.startsWith('../') && !imagePath.startsWith('http')) {
            fullPath = `../${imagePath}`;
        }
        
        console.log('Updated background blur with:', fullPath);
        document.documentElement.style.setProperty('--current-album-art', `url('${fullPath}')`);
    }

    playSong(index) {
        if (index < 0 || index >= this.favoriteSongs.length) return;
        
        this.currentSongIndex = index;
        const song = this.favoriteSongs[index];
        
        // Update background blur
        this.updatePlayerBackground(song.image);
        
        // Update player panel
        this.updatePlayerPanel(song);
        
        this.audioPlayer.src = `../${song.path}`;
        this.audioPlayer.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.renderFavorites(); // Re-render to update playing state
        }).catch(error => {
            console.error('Error playing song:', error);
        });
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.audioPlayer.pause();
            this.isPlaying = false;
        } else {
            this.audioPlayer.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButton(); // Cập nhật button sau khi play thành công
            }).catch(error => {
                console.error('Error playing song:', error);
                this.isPlaying = false;
            });
        }
        this.updatePlayButton();
    }
    
    nextSong() {
        const nextIndex = (this.currentSongIndex + 1) % this.favoriteSongs.length;
        this.playSong(nextIndex);
    }
    
    previousSong() {
        const prevIndex = this.currentSongIndex === 0 ? 
            this.favoriteSongs.length - 1 : this.currentSongIndex - 1;
        this.playSong(prevIndex);
    }
    
    updatePlayerPanel(song) {
        // Update album art
        this.albumArt.src = `../${song.image}`;
        this.albumArt.style.display = 'block';
        this.noMusicPlaceholder.style.display = 'none';
        
        // Reset album art animation để về 0 độ khi chuyển bài
        this.albumArt.classList.add('reset');
        setTimeout(() => {
            this.albumArt.classList.remove('reset');
            // Animation sẽ được cập nhật bởi updatePlayButton
        }, 50);
        
        // Update song info
        this.songTitle.textContent = song.name;
        this.songArtist.textContent = song.singer;
    }
    
    updatePlayButton() {
        const playIcon = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        this.playPauseBtn.innerHTML = `<i class="${playIcon}"></i>`;
        
        // Update album art animation
        if (this.isPlaying) {
            this.albumArt.classList.add('playing');
            this.playPauseBtn.classList.remove('paused');
        } else {
            this.albumArt.classList.remove('playing');
            this.playPauseBtn.classList.add('paused');
        }
    }
    
    updateProgress() {
        if (this.audioPlayer.duration && !isNaN(this.audioPlayer.duration)) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progressBar.value = progress;
            
            // Update CSS variable for progress bar background
            this.progressBar.style.setProperty('--progress', `${progress}%`);
            
            // Update time display
            this.currentTimeEl.textContent = this.formatTime(this.audioPlayer.currentTime || 0);
            this.totalTimeEl.textContent = this.formatTime(this.audioPlayer.duration || 0);
        } else {
            // Default values when duration is not available
            this.currentTimeEl.textContent = '0:00';
            this.totalTimeEl.textContent = '0:00';
            this.progressBar.value = 0;
            this.progressBar.style.setProperty('--progress', '0%');
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    removeFromFavorites(songName) {
        if (confirm(`Bạn có muốn xóa "${songName}" khỏi danh sách yêu thích không?`)) {
            // Remove from localStorage
            const index = this.favorites.indexOf(songName);
            if (index > -1) {
                this.favorites.splice(index, 1);
                localStorage.setItem('favorites', JSON.stringify(this.favorites));
            }
            
            // Remove from current list
            this.favoriteSongs = this.favoriteSongs.filter(song => song.name !== songName);
            
            // Adjust current index if necessary
            if (this.currentSongIndex >= this.favoriteSongs.length) {
                this.currentSongIndex = 0;
            }
            
            this.updateFavoriteCount();
            this.renderFavorites();
            
            if (this.favoriteSongs.length === 0) {
                // Hide player panel elements
                this.albumArt.style.display = 'none';
                this.noMusicPlaceholder.style.display = 'block';
                this.songTitle.textContent = '';
                this.songArtist.textContent = '';
                this.audioPlayer.pause();
                this.isPlaying = false;
            }
            
            this.showNotification(`Đã xóa "${songName}" khỏi danh sách yêu thích`, 'info');
        }
    }
    
    clearAllFavorites() {
        if (this.favoriteSongs.length === 0) return;
        
        if (confirm(`Bạn có chắc chắn muốn xóa tất cả ${this.favoriteSongs.length} bài hát yêu thích không?`)) {
            this.favorites = [];
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            this.favoriteSongs = [];
            
            this.updateFavoriteCount();
            this.renderFavorites();
            
            // Hide player panel elements
            this.albumArt.style.display = 'none';
            this.noMusicPlaceholder.style.display = 'block';
            this.songTitle.textContent = '';
            this.songArtist.textContent = '';
            this.audioPlayer.pause();
            this.isPlaying = false;
            
            this.showNotification('Đã xóa tất cả bài hát yêu thích', 'warning');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the favorite music player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const favoriteMusicPlayer = new FavoriteMusicPlayer();
});