class SongEditor {
    constructor() {
        this.currentSong = null;
        this.songIndex = null;
        this.fullPlaylist = [];
        this.newImageBase64 = null; // To store the new image data
        this.originalImage = '../img/Reality.jpg';
        this.previewAudio = document.getElementById('preview-audio');
        this.isPlaying = false;
        
        this.init();
    }
    
    init() {
        this.loadSongData();
        this.bindEvents();
    }
    
    loadSongData() {
        const urlParams = new URLSearchParams(window.location.search);
        this.playlistIndex = urlParams.get('playlistIndex');
        const playlistJSON = localStorage.getItem('currentPlaylistForEditing');

        if (this.playlistIndex !== null && playlistJSON) {
            try {
                const playlist = JSON.parse(playlistJSON);
                this.playlistIndex = parseInt(this.playlistIndex);
                this.currentSong = playlist[this.playlistIndex];
                this.fullPlaylist = playlist; // Store the full playlist

                if (this.currentSong) {
                    this.populateForm();
                } else {
                    throw new Error('Song not found at the given index.');
                }
            } catch (error) {
                console.error('Error loading song data:', error);
                this.showNotification('Lỗi khi tải dữ liệu bài hát!', 'error');
                this.redirectToHome();
            }
        } else {
            this.showNotification('Không có dữ liệu bài hát!', 'error');
            this.redirectToHome();
        }
    }

    redirectToHome() {
        // Clean up local storage before leaving
        localStorage.removeItem('currentPlaylistForEditing');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
    
    populateForm() {
        if (!this.currentSong) return;
        
        // Populate form fields
        document.getElementById('song-name').value = this.currentSong.name || '';
        document.getElementById('artist-name').value = this.currentSong.singer || '';
        document.getElementById('album-name').value = this.currentSong.album || '';
        document.getElementById('genre').value = this.currentSong.genre || '';
        document.getElementById('year').value = this.currentSong.year || '';
        
        // Update preview
        this.updatePreview();
        
        // Set preview audio source
        if (this.currentSong.path) {
            this.previewAudio.src = this.currentSong.path;
        }
        
        // Store original image
        this.originalImage = this.currentSong.image ? `../${this.currentSong.image}` : '../img/Reality.jpg';
        document.getElementById('preview-album-art').src = this.originalImage;
    }
    
    bindEvents() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            this.goBack();
        });
        
        // Form inputs - live preview
        const inputs = ['song-name', 'artist-name', 'album-name'];
        inputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.updatePreview();
            });
        });
        
        // Preview play button
        document.getElementById('preview-play-btn').addEventListener('click', () => {
            this.togglePreviewPlay();
        });

        // Image upload events
        document.getElementById('change-image-btn').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });

        document.getElementById('upload-image-btn').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });

        document.getElementById('reset-image-btn').addEventListener('click', () => {
            this.resetImage();
        });

        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // Form actions
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.goBack();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveSong();
        });
        
        document.getElementById('edit-song-form').addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission just in case
        });
        
        // Audio events
        this.previewAudio.addEventListener('ended', () => {
            this.stopPreviewPlay();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveSong();
            }
            if (e.key === 'Escape') {
                this.goBack();
            }
        });
    }
    
    updatePreview() {
        const songName = document.getElementById('song-name').value || 'Tên bài hát';
        const artistName = document.getElementById('artist-name').value || 'Tên ca sĩ';
        
        document.getElementById('preview-song-name').textContent = songName;
        document.getElementById('preview-artist-name').textContent = artistName;
    }
    
    
    togglePreviewPlay() {
        const playBtn = document.getElementById('preview-play-btn');
        
        if (this.isPlaying) {
            this.stopPreviewPlay();
        } else {
            this.startPreviewPlay();
        }
    }
    
    startPreviewPlay() {
        if (!this.previewAudio.src) {
            this.showNotification('Không có file âm thanh để phát!', 'warning');
            return;
        }
        
        this.previewAudio.play().then(() => {
            this.isPlaying = true;
            const playBtn = document.getElementById('preview-play-btn');
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playBtn.classList.add('playing');
        }).catch(error => {
            console.error('Error playing audio:', error);
            this.showNotification('Lỗi khi phát nhạc!', 'error');
        });
    }
    
    stopPreviewPlay() {
        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;
        this.isPlaying = false;
        const playBtn = document.getElementById('preview-play-btn');
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.classList.remove('playing');
    }
    
    previewChanges() {
        const formData = this.getFormData();
        const previewModal = document.createElement('div');
        previewModal.className = 'modal-overlay active';
        previewModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Xem trước thay đổi</h3>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="preview-comparison">
                        <div class="comparison-section">
                            <h4>Trước khi chỉnh sửa:</h4>
                            <div class="song-card">
                                <img src="${this.originalImage}" alt="Original">
                                <div class="song-info">
                                    <div class="song-title">${this.currentSong.name}</div>
                                    <div class="song-artist">${this.currentSong.singer}</div>
                                </div>
                            </div>
                        </div>
                        <div class="comparison-section">
                            <h4>Sau khi chỉnh sửa:</h4>
                            <div class="song-card">
                                <img src="${document.getElementById('preview-album-art').src}" alt="Updated">
                                <div class="song-info">
                                    <div class="song-title">${formData.songName}</div>
                                    <div class="song-artist">${formData.artistName}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Đóng</button>
                    <button class="btn-save" onclick="songEditor.saveSong(); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-save"></i> Lưu ngay
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewModal);
    }
    
    getFormData() {
        return {
            songName: document.getElementById('song-name').value.trim(),
            artistName: document.getElementById('artist-name').value.trim(),
            albumName: document.getElementById('album-name').value.trim(),
            genre: document.getElementById('genre').value,
            year: document.getElementById('year').value,
            imageUrl: document.getElementById('preview-album-art').src
        };
    }
    
    validateForm(formData) {
        const errors = [];
        
        if (!formData.songName) {
            errors.push('Tên bài hát không được để trống');
            document.getElementById('song-name').parentElement.classList.add('error');
        } else {
            document.getElementById('song-name').parentElement.classList.remove('error');
            document.getElementById('song-name').parentElement.classList.add('success');
        }
        
        if (!formData.artistName) {
            errors.push('Tên ca sĩ không được để trống');
            document.getElementById('artist-name').parentElement.classList.add('error');
        } else {
            document.getElementById('artist-name').parentElement.classList.remove('error');
            document.getElementById('artist-name').parentElement.classList.add('success');
        }
        
        return errors;
    }
    
    async saveSong() {
        // 1. Collect all data from the form
        const formData = this.getFormData();
        
        // 2. Validate required fields
        const validationErrors = this.validateForm(formData);
        
        if (validationErrors.length > 0) {
            // Show validation errors
            const errorMessage = 'Vui lòng điền đầy đủ thông tin:\n• ' + validationErrors.join('\n• ');
            this.showNotification(errorMessage, 'error');
            
            // Focus on first error field
            if (!formData.songName) {
                document.getElementById('song-name').focus();
            } else if (!formData.artistName) {
                document.getElementById('artist-name').focus();
            }
            
            return;
        }

        // 3. Create updated song object
        const updatedSong = {
            ...this.currentSong, // Start with existing data
            name: formData.songName,
            singer: formData.artistName,
            album: formData.albumName,
            genre: formData.genre,
            year: formData.year,
        };

        // 4. Handle image update if new image is provided
        if (this.newImageBase64) {
            updatedSong.image = this.newImageBase64; // Use 'image' field, not 'customImage'
        }

        // 5. Update the song in the local full playlist array
        const updatedPlaylist = [...this.fullPlaylist];
        updatedPlaylist[this.playlistIndex] = updatedSong;

        // 6. Send the entire updated playlist to the server
        this.showNotification('Đang lưu thông tin bài hát...', 'info');
        
        try {
            const response = await fetch('/update-music', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update', // Use "update" action instead of "edit"
                    songs: updatedPlaylist
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Server has processed and saved everything
                this.showNotification('Lưu bài hát thành công!', 'success');
                
                // Set a flag for the main page to refresh its playlist from the server
                localStorage.setItem('playlistNeedsRefresh', 'true');
                localStorage.setItem('lastEditedSongIndex', this.playlistIndex.toString());

            } else {
                // Handle server-side errors
                throw new Error(result.message || 'Lỗi không xác định từ server.');
            }
        } catch (error) {
            console.error('Error saving song:', error);
            this.showNotification(`Lỗi khi lưu: ${error.message}`, 'error');
        }
    }

    goBack() {
        this.redirectToHome();
    }
    
    hasUnsavedChanges() {
        if (!this.currentSong) return false;
        
        const formData = this.getFormData();
        return (
            formData.songName !== this.currentSong.name ||
            formData.artistName !== this.currentSong.singer ||
            formData.albumName !== (this.currentSong.album || '') ||
            formData.genre !== (this.currentSong.genre || '') ||
            formData.year !== (this.currentSong.year || '') ||
            this.newImageBase64 !== null // Check if new image is uploaded
        );
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Handle multiline messages
        if (message.includes('\n')) {
            const lines = message.split('\n');
            const container = document.createElement('div');
            lines.forEach(line => {
                const p = document.createElement('p');
                p.textContent = line;
                p.style.margin = '2px 0';
                container.appendChild(p);
            });
            notification.appendChild(container);
        } else {
            notification.textContent = message;
        }
        
        // Add close button for error messages
        if (type === 'error') {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.style.cssText = 'position: absolute; top: 8px; right: 8px; background: none; border: none; color: inherit; cursor: pointer; font-size: 14px;';
            closeBtn.onclick = () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            };
            notification.style.position = 'relative';
            notification.style.paddingRight = '40px';
            notification.appendChild(closeBtn);
        }
        
        // Add to body
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-hide notification (longer for errors)
        const hideDelay = type === 'error' ? 8000 : 3000;
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, hideDelay);
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Vui lòng chọn file ảnh hợp lệ!', 'error');
            return;
        }
        
        // Check file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('File ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            this.newImageBase64 = base64Image;
            
            // Update preview image
            document.getElementById('preview-album-art').src = base64Image;
            
            this.showNotification('Đã tải ảnh thành công!', 'success');
        };
        
        reader.onerror = () => {
            this.showNotification('Lỗi khi đọc file ảnh!', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    resetImage() {
        this.newImageBase64 = null;
        document.getElementById('preview-album-art').src = this.originalImage;
        document.getElementById('image-upload').value = '';
        this.showNotification('Đã khôi phục ảnh mặc định!', 'info');
    }
}

// Initialize when page loads
let songEditor;
document.addEventListener('DOMContentLoaded', () => {
    songEditor = new SongEditor();
});
