const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
// Tăng giới hạn kích thước request body để xử lý ảnh Base64
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the root directory (assets)
app.use(express.static(__dirname));

// Serve static files from the component directory
app.use(express.static(path.join(__dirname, 'component')));

// API endpoint để cập nhật Music.json
app.post('/update-music', async (req, res) => { // Make the handler async
    try {
        const { action, songs } = req.body;
        
        if (!action || !songs) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request format. Required: action and songs'
            });
        }

        // Process songs (skip base64 processing for existing file paths)
        const processedSongs = await Promise.all(songs.map(async (song) => {
            // 1. Auto-match image based on song name if no image is provided
            if (!song.image || song.image === '') {
                song.image = await findMatchingImage(song.name);
            }
            
            // 2. Process and save the image file only if it's base64
            if (song.image && song.image.startsWith('data:image')) {
                try {
                    // Always save base64 as file with proper naming (no timestamp)
                    song.image = await saveBase64Data(song.image, 'img', song.name, false);
                } catch (imgError) {
                    console.error(`❌ Error saving image for song "${song.name}":`, imgError);
                    song.image = 'img/Reality.jpg'; // Fallback image
                }
            }

            // 2. Only process audio if it's base64 data, not existing file path
            if (song.path && (song.path.startsWith('data:audio') || song.path.startsWith('data:application/octet-stream'))) {
                try {
                    song.path = await saveBase64Data(song.path, 'music', song.name);
                } catch (audioError) {
                    console.error(`❌ Error saving audio for song "${song.name}":`, audioError);
                    song.path = 'music/error.mp3'; 
                }
            }
            // If path is already a file path (starts with ../music/ or music/), keep it as is
            
            return song;
        }));
        
        const jsonFile = path.join(__dirname, 'Music.json');
        
        // Read existing songs from Music.json
        let existingSongs = [];
        try {
            const existingData = fs.readFileSync(jsonFile, 'utf8');
            existingSongs = JSON.parse(existingData);
        } catch (error) {
            console.log('📝 Music.json not found or empty, creating new file');
            existingSongs = [];
        }
        
        let updatedSongs = [];
        
        if (action === 'add') {
            // Add new songs to existing ones
            updatedSongs = [...existingSongs, ...processedSongs];
        } else if (action === 'update') {
            // Replace entire list and clean up unused files
            await cleanupUnusedFiles(existingSongs, processedSongs);
            updatedSongs = processedSongs;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Use "add" or "update"'
            });
        }
        
        // Write updated content
        fs.writeFileSync(jsonFile, JSON.stringify(updatedSongs, null, 4), 'utf8');
        
        res.json({
            success: true,
            message: 'Music.json updated successfully',
            songs: updatedSongs // Send the complete updated list back to the client
        });
        
        console.log(`✅ Updated Music.json - Action: ${action} - Total songs: ${updatedSongs.length}`);
        
    } catch (error) {
        console.error('❌ Error updating Music.json:', error);
        res.status(500).json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

// Function to clean up unused music files when updating playlist
async function cleanupUnusedFiles(oldSongs, newSongs) {
    try {
        // Get paths of files that are no longer needed
        const oldPaths = oldSongs.map(song => song.path).filter(path => 
            path.startsWith('music/') && !path.startsWith('../music/')
        );
        
        const newPaths = newSongs.map(song => song.path).filter(path => 
            path.startsWith('music/') && !path.startsWith('../music/')
        );
        
        const filesToDelete = oldPaths.filter(path => !newPaths.includes(path));
        
        for (const filePath of filesToDelete) {
            try {
                const fullPath = path.join(__dirname, filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log(`🗑️ Deleted unused file: ${filePath}`);
                }
            } catch (deleteError) {
                console.error(`❌ Error deleting file ${filePath}:`, deleteError);
            }
        }
        
        console.log(`🧹 Cleanup completed. Deleted ${filesToDelete.length} unused files.`);
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

// Helper function to save Base64 data to a file
async function saveBase64Data(base64String, subfolder, fileNameHint, useTimestamp = true) {
    const matches = base64String.match(/^data:(.+?);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid Base64 string format.');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    // Determine extension from MIME type, default if not found
    const extension = mimeType.split('/')[1] || 'bin'; 
    
    const safeFileName = fileNameHint.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    // Use timestamp only if requested
    const fileName = useTimestamp ? 
        `${safeFileName}_${Date.now()}.${extension}` : 
        `${safeFileName}.${extension}`;
    
    const filePath = path.join(__dirname, subfolder, fileName);
    const relativePath = `${subfolder}/${fileName}`;

    const buffer = Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    console.log(`✅ Saved new file at ${relativePath}`);
    return relativePath; // Return the relative path for JSON
}

// Helper function to find matching image based on song name
async function findMatchingImage(songName) {
    try {
        const imgDir = path.join(__dirname, 'img');
        const files = await fs.promises.readdir(imgDir);
        
        // Normalize song name for comparison
        const normalizedSongName = songName.toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove special characters
            .trim();
        
        // Look for exact or partial matches
        const possibleMatches = files.filter(file => {
            const fileName = file.toLowerCase()
                .replace(/\.[^/.]+$/, '') // Remove extension
                .replace(/[^a-z0-9]/g, ''); // Remove special characters
            
            return fileName.includes(normalizedSongName) || normalizedSongName.includes(fileName);
        });
        
        if (possibleMatches.length > 0) {
            // Prefer exact matches, then partial matches
            const exactMatch = possibleMatches.find(file => {
                const fileName = file.toLowerCase()
                    .replace(/\.[^/.]+$/, '')
                    .replace(/[^a-z0-9]/g, '');
                return fileName === normalizedSongName;
            });
            
            const selectedImage = exactMatch || possibleMatches[0];
            console.log(`🖼️ Auto-matched image for "${songName}": ${selectedImage}`);
            return `img/${selectedImage}`;
        }
        
        // If no match found, use default
        console.log(`📷 No matching image found for "${songName}", using default`);
        return 'img/Reality.jpg';
        
    } catch (error) {
        console.error('❌ Error finding matching image:', error);
        return 'img/Reality.jpg';
    }
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'component', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎵 Music Player Server running at http://localhost:${PORT}`);
    console.log(`📂 Access app at: http://localhost:${PORT}/index.html`);
    console.log(`🔧 API endpoint: http://localhost:${PORT}/update-music`);
});
