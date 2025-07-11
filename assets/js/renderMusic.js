class MusicPlayer {
    constructor() {
        this.songs = [];
        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeated = false;
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        // Shuffle history để track các bài đã phát trong chu kỳ hiện tại
        this.shuffleHistory = [];
        this.shuffleCycleCount = 0;
        
        this.audioPlayer = document.getElementById('audio-player');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.repeatBtn = document.getElementById('repeat-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        this.currentSongTitleEl = document.getElementById('current-song-title');
        this.currentSongArtistEl = document.getElementById('current-song-artist');
        this.albumArtEl = document.getElementById('album-art');
        this.playlistEl = document.getElementById('playlist');
        this.searchInput = document.getElementById('search-input');
        
        // Add Song Modal elements
        this.addSongBtn = document.getElementById('add-song-btn');
        this.addSongModal = document.getElementById('add-song-modal');
        this.closeModalBtn = document.getElementById('close-modal');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.addSongForm = document.getElementById('add-song-form');
        this.songFileInput = document.getElementById('song-file');
        this.fileInfoDiv = document.getElementById('file-info');
        this.fileUploadArea = document.getElementById('file-upload-area');
        this.chooseFileBtn = document.getElementById('choose-file-btn');
        
        this.init();
    }
    
    // Method để reset playlist về trạng thái ban đầu (xóa localStorage)
    resetPlaylist() {
        if (confirm('Bạn có muốn khôi phục playlist về trạng thái ban đầu không? (Xóa tất cả thay đổi)')) {
            localStorage.removeItem('deletedSongs');
            localStorage.removeItem('userAddedSongs');
            localStorage.removeItem('favorites');
            this.showNotification('🔄 Playlist đã được khôi phục về trạng thái ban đầu!', 'info');
            location.reload(); // Reload trang để load lại từ JSON gốc
        }
    }
    
    async init() {
        await this.loadSongs();
        this.renderPlaylist();
        this.bindEvents();
        
        // Initialize player state
        if (this.songs.length > 0) {
            this.loadSong(0);
        } else {
            this.resetPlayerToEmpty();
        }
        
        // Check if playlist needs refresh after editing a song
        this.checkForPlaylistRefresh();
        
        // Initialize theme
        this.initTheme();
    }
    
    resetPlayerToEmpty() {
        // Reset song info
        this.currentSongTitleEl.textContent = '';
        this.currentSongArtistEl.textContent = '';
        
        // Show placeholder and hide album art
        const placeholder = document.getElementById('no-music-placeholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        this.albumArtEl.style.display = 'none';
        this.albumArtEl.src = '';
        
        // Clear player background
        this.updatePlayerBackground('');
        
        // Reset audio player
        this.audioPlayer.src = '';
        this.progressBar.value = 0;
        this.currentTimeEl.textContent = '0:00';
        this.totalTimeEl.textContent = '0:00';
        
        // Reset play button and album art animation
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.playPauseBtn.classList.add('paused');
        this.isPlaying = false;
        this.albumArtEl.classList.remove('playing', 'reset');
    }
    
    async loadSongs() {
        try {
            const response = await fetch('./assets/Music.json');
            const jsonSongs = await response.json();
            
            // Store original songs (without user added songs)
            this.originalSongs = [...jsonSongs];
            
            // Build the complete songs array
            this.buildSongsArray();
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    }
    
    renderPlaylist() {
        this.playlistEl.innerHTML = '';
        
        // Check if playlist is empty
        if (this.songs.length === 0) {
            this.playlistEl.innerHTML = '<div class="empty-playlist">Không có bài hát nào trong playlist</div>';
            this.resetPlayerToEmpty();
            return;
        }
        
        this.songs.forEach((song, index) => {
            const isFavorite = this.favorites.includes(song.name);
            const playlistItem = document.createElement('div');
            playlistItem.className = `playlist-item ${index === this.currentSongIndex ? 'active' : ''}`;
            // Handle different image path formats
            let imageSource;
            if (song.image && song.image.startsWith('data:image')) {
                imageSource = song.image; // Base64 image
            } else if (song.image && song.image.startsWith('./assets/')) {
                imageSource = song.image; // Already has correct path
            } else if (song.image && song.image.startsWith('img/')) {
                imageSource = `./assets/${song.image}`; // Convert img/ to ./assets/img/
            } else if (song.image) {
                imageSource = `./assets/img/${song.image}`; // Just filename - add full path
            } else {
                imageSource = './assets/img/Reality.jpg'; // Default
            }
            playlistItem.innerHTML = `
                <div class="playlist-item-number">${index + 1}</div>
                <img src="${imageSource}" alt="${song.name}" onerror="this.src='./assets/img/Reality.jpg'">
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${song.name}</div>
                    <div class="playlist-item-artist">${song.singer}</div>
                </div>
                <div class="playlist-item-duration" data-song-index="${index}">
                    <span class="duration-text">--:--</span>
                </div>
                <div class="playlist-item-actions">
                    <button class="playlist-action-btn favorite-btn ${isFavorite ? 'active' : ''}" title="${isFavorite ? 'Bỏ thích' : 'Thích'}" data-song-name="${song.name}">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="playlist-action-btn edit-btn" title="Chỉnh sửa" data-song-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="playlist-action-btn delete-btn" title="Xóa" data-song-index="${index}">
                        <i class="far fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            // Add click event for the entire item (excluding action buttons)
            const songInfo = playlistItem.querySelector('.playlist-item-info');
            const albumImg = playlistItem.querySelector('img');
            
            songInfo.addEventListener('click', () => {
                this.loadSong(index);
                this.play();
            });
            
            albumImg.addEventListener('click', () => {
                this.loadSong(index);
                this.play();
            });
            
            // Add event listeners for action buttons
            const favoriteBtn = playlistItem.querySelector('.favorite-btn');
            const editBtn = playlistItem.querySelector('.edit-btn');
            const deleteBtn = playlistItem.querySelector('.delete-btn');
            
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(song.name);
            });
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editSongInfo(index);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSong(index);
            });
            
            this.playlistEl.appendChild(playlistItem);
        });
        
        // Load durations for all songs
        this.loadSongDurations();
    }
    
    // Function to load and display duration for each song
    async loadSongDurations() {
        const durationElements = document.querySelectorAll('.playlist-item-duration');
        
        for (let i = 0; i < this.songs.length; i++) {
            const song = this.songs[i];
            const durationElement = durationElements[i];
            
            if (durationElement && song.path) {
                try {
                    const duration = await this.getAudioDuration(song.path);
                    const durationText = durationElement.querySelector('.duration-text');
                    if (durationText) {
                        durationText.textContent = this.formatTime(duration);
                    }
                } catch (error) {
                    console.log(`Could not load duration for ${song.name}:`, error);
                    const durationText = durationElement.querySelector('.duration-text');
                    if (durationText) {
                        durationText.textContent = '--:--';
                    }
                }
            }
        }
    }
    
    // Function to get audio duration
    getAudioDuration(audioPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'metadata';
            
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
            };
            
            audio.onerror = () => {
                reject(new Error('Could not load audio file'));
            };
            
            // Handle case where duration is not available immediately
            audio.ondurationchange = () => {
                if (audio.duration && audio.duration !== Infinity) {
                    resolve(audio.duration);
                }
            };
            
            audio.src = audioPath;
        });
    }
    
    bindEvents() {
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });
        
        // Previous button
        this.prevBtn.addEventListener('click', () => {
            this.previousSong();
        });
        
        // Next button
        this.nextBtn.addEventListener('click', () => {
            this.nextSong();
        });
        
        // Shuffle button
        this.shuffleBtn.addEventListener('click', () => {
            this.toggleShuffle();
        });
        
        // Repeat button
        this.repeatBtn.addEventListener('click', () => {
            this.toggleRepeat();
        });
        
        // Progress bar
        this.progressBar.addEventListener('input', () => {
            const seekTime = (this.progressBar.value / 100) * this.audioPlayer.duration;
            this.audioPlayer.currentTime = seekTime;
        });
        
        // Audio events
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            if (this.isRepeated) {
                this.audioPlayer.currentTime = 0;
                this.play();
            } else {
                this.nextSong();
            }
        });
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.searchSongs(e.target.value);
        });
        
        // Add Song Modal Events
        this.addSongBtn.addEventListener('click', () => {
            this.openAddSongModal();
        });

        this.closeModalBtn.addEventListener('click', () => {
            this.closeAddSongModal();
        });

        this.cancelBtn.addEventListener('click', () => {
            this.closeAddSongModal();
        });

        this.addSongModal.addEventListener('click', (e) => {
            if (e.target === this.addSongModal) {
                this.closeAddSongModal();
            }
        });

        this.songFileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        this.addSongForm.addEventListener('submit', (e) => {
            this.handleAddSong(e);
        });

        // File upload area events
        this.fileUploadArea.addEventListener('click', () => {
            this.songFileInput.click();
        });

        this.chooseFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.songFileInput.click();
        });

        // Drag and drop events
        this.fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.add('dragover');
        });

        this.fileUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.remove('dragover');
        });

        this.fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.songFileInput.files = files;
                this.handleFileSelect({ target: { files: files } });
            }
        });
    }
    
    // Hiển thị trạng thái shuffle trong console để debug
    getShuffleStatus() {
        if (!this.isShuffled) return '';
        
        const totalSongs = this.songs.length;
        const playedSongs = this.shuffleHistory.length;
        const remainingSongs = totalSongs - playedSongs;
        
        return `Chu kỳ ${this.shuffleCycleCount}: ${playedSongs}/${totalSongs} bài đã phát, còn ${remainingSongs} bài chưa phát`;
    }
    
    loadSong(index) {
        if (index < 0 || index >= this.songs.length) return;
        
        // Nếu đang bật shuffle và chọn bài thủ công, thêm vào lịch sử
        if (this.isShuffled && !this.shuffleHistory.includes(index)) {
            this.shuffleHistory.push(index);
        }
        
        this.currentSongIndex = index;
        const song = this.songs[index];
        
        // Handle different path formats
        let audioPath;
        if (song.path.startsWith('data:audio') || song.path.startsWith('blob:')) {
            // Base64 or blob URL - use as is
            audioPath = song.path;
        } else if (song.path.startsWith('./assets/') || song.path.startsWith('../') || song.path.startsWith('music/')) {
            // Already has proper path or uploaded file path - use as is
            audioPath = song.path;
        } else {
            // Old format - add ./assets/
            audioPath = `./assets/${song.path}`;
        }
        
        this.audioPlayer.src = audioPath;

        this.currentSongTitleEl.textContent = song.name;
        this.currentSongArtistEl.textContent = song.singer;
        
        // Show album art and hide placeholder
        const placeholder = document.getElementById('no-music-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        this.albumArtEl.style.display = 'block';
        
        // Handle different image path formats
        let imageSource;
        if (song.image && song.image.startsWith('data:image')) {
            imageSource = song.image; // Base64 image
        } else if (song.image && song.image.startsWith('./assets/')) {
            imageSource = song.image; // Already has correct path
        } else if (song.image && song.image.startsWith('img/')) {
            imageSource = `./assets/${song.image}`; // Convert img/ to ./assets/img/
        } else if (song.image) {
            imageSource = `./assets/img/${song.image}`; // Just filename - add full path
        } else {
            imageSource = './assets/img/Reality.jpg'; // Default
        }
        
        this.albumArtEl.src = imageSource;
        this.albumArtEl.onerror = () => {
            this.albumArtEl.src = './assets/img/Reality.jpg';
            // Update background when fallback image loads
            this.updatePlayerBackground('./assets/img/Reality.jpg');
        };
        
        // Update player panel background with album art
        this.updatePlayerBackground(imageSource);
        
        // Reset album art animation for new song only
        this.albumArtEl.classList.remove('playing', 'reset');
        this.albumArtEl.classList.add('reset');
        
        // Force reflow to apply reset
        this.albumArtEl.offsetHeight;
        
        // Remove reset class immediately to allow animation to be controlled by play/pause
        setTimeout(() => {
            this.albumArtEl.classList.remove('reset');
            // Don't automatically add playing class here - let play() method handle it
        }, 10);
        
        // Update active playlist item
        document.querySelectorAll('.playlist-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // Log shuffle status nếu cần debug
        if (this.isShuffled) {
            console.log(this.getShuffleStatus());
        }
    }
    
    play() {
        this.audioPlayer.play().then(() => {
            this.isPlaying = true;
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.albumArtEl.classList.add('playing');
        }).catch(error => {
            console.error('Error playing audio:', error);
        });
    }
    
    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        // Remove playing class to pause animation at current position (not reset to 0)
        this.albumArtEl.classList.remove('playing');
    }
    
    nextSong() {
        let nextIndex;
        if (this.isShuffled) {
            nextIndex = this.getNextShuffleIndex();
        } else {
            nextIndex = (this.currentSongIndex + 1) % this.songs.length;
        }
        this.loadSong(nextIndex);
        if (this.isPlaying) {
            this.play();
        }
    }
    
    previousSong() {
        let prevIndex;
        if (this.isShuffled) {
            prevIndex = this.getPreviousShuffleIndex();
        } else {
            prevIndex = this.currentSongIndex === 0 ? this.songs.length - 1 : this.currentSongIndex - 1;
        }
        this.loadSong(prevIndex);
        if (this.isPlaying) {
            this.play();
        }
    }
    
    // Lấy index tiếp theo khi shuffle - không trùng lặp trong chu kỳ
    getNextShuffleIndex() {
        if (this.songs.length <= 1) {
            return 0;
        }
        
        // Lấy danh sách các bài chưa phát trong chu kỳ hiện tại
        const unplayedSongs = [];
        for (let i = 0; i < this.songs.length; i++) {
            if (!this.shuffleHistory.includes(i)) {
                unplayedSongs.push(i);
            }
        }
        
        // Nếu đã phát hết tất cả bài trong chu kỳ
        if (unplayedSongs.length === 0) {
            // Reset chu kỳ mới
            this.shuffleHistory = [];
            this.shuffleCycleCount++;
            
            // Tạo lại danh sách các bài chưa phát (trừ bài hiện tại)
            for (let i = 0; i < this.songs.length; i++) {
                if (i !== this.currentSongIndex) {
                    unplayedSongs.push(i);
                }
            }
            
            this.showNotification(`🔄 Chu kỳ ngẫu nhiên ${this.shuffleCycleCount}: Đã phát hết playlist, bắt đầu chu kỳ mới!`, 'info');
        }
        
        // Chọn ngẫu nhiên từ danh sách chưa phát
        const randomIndex = Math.floor(Math.random() * unplayedSongs.length);
        const selectedIndex = unplayedSongs[randomIndex];
        
        // Thêm vào lịch sử đã phát
        this.shuffleHistory.push(selectedIndex);
        
        return selectedIndex;
    }
    
    // Lấy index trước đó khi shuffle - quay lại bài trước trong lịch sử
    getPreviousShuffleIndex() {
        if (this.songs.length <= 1) {
            return 0;
        }
        
        // Tìm vị trí hiện tại trong lịch sử shuffle
        const currentHistoryIndex = this.shuffleHistory.indexOf(this.currentSongIndex);
        
        if (currentHistoryIndex > 0) {
            // Quay lại bài trước trong lịch sử
            return this.shuffleHistory[currentHistoryIndex - 1];
        } else {
            // Nếu đang ở đầu lịch sử, chọn bài cuối trong lịch sử
            if (this.shuffleHistory.length > 1) {
                return this.shuffleHistory[this.shuffleHistory.length - 1];
            } else {
                // Nếu chưa có lịch sử, tạo bài ngẫu nhiên mới
                return this.getNextShuffleIndex();
            }
        }
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active', this.isShuffled);
        
        if (this.isShuffled) {
            // Bắt đầu chu kỳ shuffle mới
            this.shuffleHistory = [this.currentSongIndex]; // Bài hiện tại đã được "phát"
            this.shuffleCycleCount = 1;
            this.showNotification('🔀 Bật chế độ ngẫu nhiên - Không trùng lặp trong chu kỳ!', 'info');
        } else {
            // Tắt shuffle, reset lịch sử
            this.shuffleHistory = [];
            this.shuffleCycleCount = 0;
            this.showNotification('➡️ Tắt chế độ ngẫu nhiên', 'info');
        }
    }
    
    toggleRepeat() {
        this.isRepeated = !this.isRepeated;
        this.repeatBtn.classList.toggle('active', this.isRepeated);
    }
    
    updateProgress() {
        if (this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progressBar.value = progress;
            
            // Update CSS custom property for gradient
            this.progressBar.style.setProperty('--progress', `${progress}%`);
            
            this.currentTimeEl.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
    }
    
    updateTotalTime() {
        this.totalTimeEl.textContent = this.formatTime(this.audioPlayer.duration);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    searchSongs(query) {
        if (!query.trim()) {
            this.songs = [...this.originalSongs];
        } else {
            this.songs = this.originalSongs.filter(song => 
                song.name.toLowerCase().includes(query.toLowerCase()) ||
                song.singer.toLowerCase().includes(query.toLowerCase())
            );
        }
        this.renderPlaylist();
        
        // Reset current song index if current song is not in filtered results
        const currentSong = this.originalSongs[this.currentSongIndex];
        const newIndex = this.songs.findIndex(song => song.name === currentSong.name);
        if (newIndex !== -1) {
            this.currentSongIndex = newIndex;
        } else {
            this.currentSongIndex = 0;
        }
    }
    
    toggleFavorite(songName) {
        const index = this.favorites.indexOf(songName);
        if (index === -1) {
            // Add to favorites
            this.favorites.push(songName);
            this.showNotification(`Đã thêm "${songName}" vào danh sách yêu thích`, 'success');
        } else {
            // Remove from favorites
            this.favorites.splice(index, 1);
            this.showNotification(`Đã xóa "${songName}" khỏi danh sách yêu thích`, 'info');
        }
        
        // Save to localStorage
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        // Update the UI
        this.renderPlaylist();
    }
    
    async deleteSong(index) {
        if (confirm('Bạn có chắc chắn muốn xóa bài hát này khỏi playlist?')) {
            const deletedSong = this.songs[index];
            const isDeletingCurrent = index === this.currentSongIndex;
            const wasPlaying = this.isPlaying;
            
            try {
                // Dừng nhạc ngay lập tức nếu xóa bài đang phát
                if (isDeletingCurrent) {
                    this.pause();
                    this.audioPlayer.src = '';
                }

                // Xóa khỏi array tạm thời để cập nhật giao diện ngay
                this.songs.splice(index, 1);
                
                // Adjust current song index if necessary
                if (index < this.currentSongIndex) {
                    this.currentSongIndex--;
                } else if (this.currentSongIndex >= this.songs.length && this.songs.length > 0) {
                    this.currentSongIndex = 0;
                }

                // Cập nhật giao diện ngay lập tức
                this.renderPlaylist();

                // Load new current song and play if it was playing before
                if (isDeletingCurrent) {
                    if (this.songs.length > 0) {
                        this.loadSong(this.currentSongIndex);
                        if (wasPlaying) {
                            this.play();
                        }
                    } else {
                        this.resetPlayerToEmpty();
                    }
                }

                // Gửi danh sách đã cập nhật lên server
                const response = await fetch('/update-music', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'update', // Sử dụng 'update' để thay thế toàn bộ danh sách
                        songs: this.songs
                    })
                });

                const result = await response.json();

                if (result.success) {
                    this.showNotification(`✅ Đã xóa "${deletedSong.name}" khỏi playlist`, 'success');
                } else {
                    throw new Error(result.message || 'Server error');
                }

            } catch (error) {
                console.error('Error deleting song:', error);
                this.showNotification('❌ Có lỗi xảy ra khi xóa bài hát!', 'error');
                
                // Reload lại từ server nếu có lỗi
                await this.loadSongs();
                this.renderPlaylist();
            }
        }
    }
    
    editSongInfo(index) {
        const song = this.songs[index];

        // Prepare song data to pass to edit page
        const songData = {
            name: song.name,
            singer: song.singer,
            path: song.path,
            image: song.image,
            album: song.album || '',
            genre: song.genre || '',
            year: song.year || '',
            isUserAdded: song.isUserAdded || false, // Mark if it's a user-added song
            originalFileName: song.originalFileName // Keep for reference if it exists
        };

        // Store the full current playlist in localStorage so edit.js can access it
        localStorage.setItem('currentPlaylistForEditing', JSON.stringify(this.songs));
        
        // Encode song data for URL
        const encodedSongData = encodeURIComponent(JSON.stringify(songData));
        
        // Navigate to edit page with song data and its index in the current playlist
        window.location.href = `edit.html?playlistIndex=${index}`;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
    
    checkForPlaylistRefresh() {
        const needsRefresh = localStorage.getItem('playlistNeedsRefresh');
        const lastEditedIndex = localStorage.getItem('lastEditedSongIndex');
        
        if (needsRefresh === 'true') {
            // Clear the refresh flag
            localStorage.removeItem('playlistNeedsRefresh');
            localStorage.removeItem('lastEditedSongIndex');
            
            // Rebuild songs array
            this.buildSongsArray();
            
            // Re-render playlist
            this.renderPlaylist();
            
            // Update current song display if the edited song is currently playing
            if (lastEditedIndex !== null && parseInt(lastEditedIndex) === this.currentSongIndex) {
                const currentSong = this.songs[this.currentSongIndex];
                if (currentSong) {
                    this.currentSongTitleEl.textContent = currentSong.name;
                    this.currentSongArtistEl.textContent = currentSong.singer;
                    // Update album art if changed
                    this.loadSong(this.currentSongIndex);
                }
            }
            
            this.showNotification('✨ Đã cập nhật thông tin bài hát!', 'success');
        }
    }

    buildSongsArray() {
        // Rebuild the songs array from original songs, filtering out deleted ones
        const deletedSongs = JSON.parse(localStorage.getItem('deletedSongs')) || [];
        
        this.songs = this.originalSongs.filter(song => 
            !deletedSongs.some(deleted => deleted.name === song.name)
        );
    }

    // Add Song Modal Methods
    openAddSongModal() {
        this.addSongModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeAddSongModal() {
        this.addSongModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.resetAddSongForm();
    }

    resetAddSongForm() {
        this.addSongForm.reset();
        this.fileInfoDiv.classList.remove('show');
        this.fileInfoDiv.innerHTML = '';
        
        // Reset upload area to original state
        this.fileUploadArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <div class="upload-text">
                <h4>Drop Files Here</h4>
                <p>or</p>
            </div>
            <button type="button" class="choose-file-btn" id="choose-file-btn">
                <i class="fas fa-folder-open"></i>
                Choose File
            </button>
        `;
        
        // Re-bind events for the new choose file button
        const newChooseBtn = document.getElementById('choose-file-btn');
        if (newChooseBtn) {
            newChooseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.songFileInput.click();
            });
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            // Check if it's an audio file
            if (!file.type.startsWith('audio/')) {
                this.showNotification('❌ Vui lòng chọn file âm thanh hợp lệ!', 'error');
                return;
            }

            // Update upload area to show selected file
            this.fileUploadArea.innerHTML = `
                <div class="upload-icon">
                    <i class="fas fa-music"></i>
                </div>
                <div class="upload-text">
                    <h4>${file.name}</h4>
                    <p>${(file.size / (1024 * 1024)).toFixed(2)} MB • ${file.type}</p>
                </div>
                <button type="button" class="choose-file-btn" onclick="document.getElementById('song-file').click()">
                    <i class="fas fa-edit"></i>
                    Change File
                </button>
            `;

            // Show file info
            this.fileInfoDiv.innerHTML = `
                <strong>File:</strong> ${file.name}<br>
                <strong>Size:</strong> ${(file.size / (1024 * 1024)).toFixed(2)} MB<br>
                <strong>Type:</strong> ${file.type}
            `;
            this.fileInfoDiv.classList.add('show');
        }
    }

    async handleAddSong(e) {
        e.preventDefault();
        
        const formData = new FormData(this.addSongForm);
        const songFile = formData.get('song-file');

        if (!songFile) {
            this.showNotification('❌ Vui lòng chọn file âm thanh!', 'error');
            return;
        }

        try {
            // Show loading
            const submitBtn = this.addSongForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang thêm...';

            // Parse file name to extract song name and artist
            const fileName = songFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
            let songName = fileName;
            let artistName = "Unknown Artist";
            
            // Try to parse common formats: "Artist - Song", "Artist-Song", etc.
            if (fileName.includes(' - ')) {
                const parts = fileName.split(' - ');
                artistName = parts[0].trim();
                songName = parts.slice(1).join(' - ').trim(); // Handle multiple dashes
            } else if (fileName.includes('-') && !fileName.includes('_')) {
                const parts = fileName.split('-');
                if (parts.length >= 2) {
                    artistName = parts[0].trim();
                    songName = parts.slice(1).join('-').trim();
                }
            }

            // Get original file name and create path pointing to existing file
            const originalFileName = songFile.name;
            const musicPath = `./assets/music/${originalFileName}`;

            // Create new song object for server (without base64 data)
            const newSong = {
                name: songName,
                singer: artistName,
                path: musicPath, // Point to existing file in music folder
                image: '', 
                album: ''
            };

            // Send to server to save permanently
            const response = await fetch('/update-music', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add',
                    songs: [newSong]
                })
            });

            const result = await response.json();

            if (result.success) {
                // Reload songs from server to get updated list
                await this.loadSongs();
                this.renderPlaylist();
                
                // Close modal
                this.closeAddSongModal();
                
                // Show success message
                this.showNotification('✅ Đã thêm bài hát thành công!', 'success');
            } else {
                throw new Error(result.message || 'Server error');
            }

            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

        } catch (error) {
            console.error('Error adding song:', error);
            this.showNotification('❌ Có lỗi xảy ra khi thêm bài hát: ' + error.message, 'error');
            
            // Reset button
            const submitBtn = this.addSongForm.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Song';
        }
    }

    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Update player panel background with album art
    updatePlayerBackground(imageSource) {
        if (imageSource) {
            // Update CSS variable for background blur effect
            document.documentElement.style.setProperty('--current-album-art', `url('${imageSource}')`);
            console.log('🎨 Updated background blur with:', imageSource);
            console.log('🔍 CSS Variable set to:', getComputedStyle(document.documentElement).getPropertyValue('--current-album-art'));
        } else {
            // Clear background when no image
            document.documentElement.style.removeProperty('--current-album-art');
            console.log('🧹 Cleared background blur');
        }
    }

    // Initialize theme
    initTheme() {
        // Theme functionality is handled by theme.js
        // This method exists for compatibility
    }
}

// Initialize the music player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const musicPlayer = new MusicPlayer();
});
