class FavoriteMusicPlayer {
    constructor() {
        this.allSongs = [];
        this.favoriteSongs = [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.currentSongIndex = 0;
        this.isPlaying = false;
            this.isShuffled = false;
        this.isRepeated = false;
        this.currentSort = 'name';
        
        // Animation tracking for album art rotation
        this.rotationAngle = 0;
        this.animationStartTime = 0;
        this.animationPausedTime = 0;
        
        this.audioPlayer = document.getElementById('audio-player');
        this.favoritesListEl = document.getElementById('favorites-list');
        this.emptyStateEl = document.getElementById('empty-state');
        this.favoriteCountEl = document.getElementById('favorite-count');
        
        // Player panel elements
        this.albumArtEl = document.getElementById('album-art');
        this.currentSongTitleEl = document.getElementById('current-song-title');
        this.currentSongArtistEl = document.getElementById('current-song-artist');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.repeatBtn = document.getElementById('repeat-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        
        this.init();
    }
    
    async init() {
        // Clear any previous background from HTML tag and root
        document.documentElement.style.removeProperty('--current-album-art');
        document.querySelector('html').removeAttribute('style');
        
        await this.loadAllSongs();
        this.loadFavoriteSongs();
        this.renderFavorites();
        this.bindEvents();
        
        // Initialize player panel if we have favorite songs
        if (this.favoriteSongs.length > 0) {
            this.updatePlayerPanel();
        }
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
        
        // If we have favorite songs and current index is valid, update player panel
        if (this.favoriteSongs.length > 0 && this.currentSongIndex < this.favoriteSongs.length) {
            this.updatePlayerPanel();
        }
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
            songItem.className = `favorite-song-item ${index === this.currentSongIndex ? 'playing active' : ''}`;
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
        
        // Player panel controls
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        this.prevBtn.addEventListener('click', () => {
            this.previousSong();
        });
        
        this.nextBtn.addEventListener('click', () => {
            this.nextSong();
        });
        
        this.shuffleBtn.addEventListener('click', () => {
            this.toggleShuffle();
        });
        
        this.repeatBtn.addEventListener('click', () => {
            this.toggleRepeat();
        });
        
        // Audio events
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            this.nextSong();
        });
        
        // Add play/pause event listeners to sync UI state
        this.audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.syncUIState();
        });
        
        this.audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.syncUIState();
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
    
    playSong(index) {
        if (index < 0 || index >= this.favoriteSongs.length) return;
        
        this.currentSongIndex = index;
        const song = this.favoriteSongs[index];
        
        // Force reset album art animation to 0 degrees for new song
        this.albumArtEl.classList.remove('playing');
        this.albumArtEl.classList.add('reset');
        
        // Force reflow to apply reset
        this.albumArtEl.offsetHeight;
        
        // Remove reset and prepare for new animation
        setTimeout(() => {
            this.albumArtEl.classList.remove('reset');
        }, 10);
        
        this.audioPlayer.src = `../${song.path}`;
        this.isPlaying = true;
        this.updatePlayerPanel();
        this.renderFavorites(); // Re-render to update playing state
        
        this.audioPlayer.play().catch(error => {
            console.error('Error playing song:', error);
            this.isPlaying = false;
            this.updatePlayerPanel();
        });
        updatePlayerBackground(song.image);
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.audioPlayer.pause();
            // isPlaying will be set to false in pause event listener
        } else {
            this.audioPlayer.play().catch(error => {
                console.error('Error playing song:', error);
            });
            // isPlaying will be set to true in play event listener
        }
        // updatePlayerPanel will be called by event listeners
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
    
    updatePlayerPanel() {
        if (this.favoriteSongs.length === 0) {
            // Clear background when no songs
            document.documentElement.style.removeProperty('--current-album-art');
            return;
        }
        
        const song = this.favoriteSongs[this.currentSongIndex];
        
        // Handle different image path formats
        let imageSource;
        if (song.image && song.image.startsWith('data:image')) {
            imageSource = song.image; // Base64 image
        } else if (song.image && (song.image.startsWith('../') || song.image.startsWith('img/'))) {
            imageSource = song.image; // Proper path format
        } else if (song.image) {
            imageSource = `../${song.image}`; // Old format - add ../
        } else {
            imageSource = '../img/Reality.jpg'; // Default
        }
        
        // Show album art and hide placeholder
        const placeholder = document.getElementById('no-music-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        this.albumArtEl.style.display = 'block';
        this.albumArtEl.src = imageSource;
        this.albumArtEl.onerror = () => {
            this.albumArtEl.src = '../img/Reality.jpg';
        };
        
        // Update song info
        this.currentSongTitleEl.textContent = song.name;
        this.currentSongArtistEl.textContent = song.singer;
        
        // Sync UI state with actual audio state
        this.syncUIState();
    }
    
    syncUIState() {
        // Update play/pause button based on actual audio state
        const playIcon = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        this.playPauseBtn.innerHTML = `<i class="${playIcon}"></i>`;
        
        // Update album art animation based on actual playing state
        this.updateAlbumArtAnimation();
    }
    
    updateAlbumArtAnimation() {
        if (this.isPlaying) {
            // When playing, add playing class to start/resume animation
            this.albumArtEl.classList.add('playing');
        } else {
            // When paused, remove playing class to pause animation at current position
            this.albumArtEl.classList.remove('playing');
        }
    }
    
    updateProgress() {
        if (this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progressBar.value = progress;
            this.progressBar.style.setProperty('--progress', `${progress}%`);
            
            // Update current time
            const minutes = Math.floor(this.audioPlayer.currentTime / 60);
            const seconds = Math.floor(this.audioPlayer.currentTime % 60);
            this.currentTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateTotalTime() {
        if (this.audioPlayer.duration) {
            const minutes = Math.floor(this.audioPlayer.duration / 60);
            const seconds = Math.floor(this.audioPlayer.duration % 60);
            this.totalTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    removeFromFavorites(songName) {
        const index = this.favorites.indexOf(songName);
        if (index !== -1) {
            this.favorites.splice(index, 1);
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            
            // Reload favorite songs
            this.loadFavoriteSongs();
            this.renderFavorites();
            
            // If currently playing song was removed, stop player
            const currentSong = this.favoriteSongs[this.currentSongIndex];
            if (!currentSong || currentSong.name === songName) {
                this.audioPlayer.pause();
                this.isPlaying = false;
                this.currentSongIndex = 0;
                
                // Stop album art animation
                this.albumArtEl.classList.remove('playing');
                this.albumArtEl.style.transform = 'rotate(0deg)';
                
                if (this.favoriteSongs.length > 0) {
                    this.updatePlayerPanel();
                } else {
                    // Reset player to empty state
                    this.currentSongTitleEl.textContent = '';
                    this.currentSongArtistEl.textContent = '';
                    this.albumArtEl.style.display = 'none';
                    const placeholder = document.getElementById('no-music-placeholder');
                    if (placeholder) {
                        placeholder.style.display = 'flex';
                    }
                    // Clear background
                    document.documentElement.style.removeProperty('--current-album-art');
                }
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
            
            // Clear background
            document.documentElement.style.removeProperty('--current-album-art');
            
            // Stop player and reset animation
            this.audioPlayer.pause();
            this.isPlaying = false;
            this.albumArtEl.classList.remove('playing');
            this.albumArtEl.style.transform = 'rotate(0deg)';
            this.albumArtEl.style.display = 'none';
            
            // Show placeholder
            const placeholder = document.getElementById('no-music-placeholder');
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
            
            // Clear song info
            this.currentSongTitleEl.textContent = '';
            this.currentSongArtistEl.textContent = '';
            
            this.updateFavoriteCount();
            this.renderFavorites();
            
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

function updatePlayerBackground(imagePath) {
    // Chuyển đổi đường dẫn relative nếu cần
    let fullPath = imagePath;
    if (imagePath && !imagePath.startsWith('../') && !imagePath.startsWith('http')) {
        fullPath = `../${imagePath}`;
    }
    
    console.log('Updated background blur with:', fullPath);
    document.documentElement.style.setProperty('--current-album-art', `url('${fullPath}')`);
}
