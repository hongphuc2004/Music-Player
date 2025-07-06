// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Support multiple button IDs and types
    const themeToggleBtn = document.getElementById('theme-toggle-btn') || document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeEmojiIcon = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon') : null;
    const body = document.body;

    // Get saved theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply saved theme
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        // Update FontAwesome icon
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
        // Update emoji icon
        if (themeEmojiIcon) {
            themeEmojiIcon.textContent = '☀️';
        }
    } else {
        body.classList.remove('light-theme');
        // Update FontAwesome icon
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
        // Update emoji icon
        if (themeEmojiIcon) {
            themeEmojiIcon.textContent = '🌙';
        }
    }

    // Theme toggle click handler
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            if (body.classList.contains('light-theme')) {
                // Switch to dark theme
                body.classList.remove('light-theme');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-moon';
                }
                if (themeEmojiIcon) {
                    themeEmojiIcon.textContent = '🌙';
                }
                localStorage.setItem('theme', 'dark');
            } else {
                // Switch to light theme
                body.classList.add('light-theme');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-sun';
                }
                if (themeEmojiIcon) {
                    themeEmojiIcon.textContent = '☀️';
                }
                localStorage.setItem('theme', 'light');
            }
        });
    }
});
