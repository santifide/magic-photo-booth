const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// API endpoint to get background images
app.get('/api/backgrounds', (req, res) => {
    const backgroundsDir = path.join(__dirname, 'backgrounds');
    try {
        if (!fs.existsSync(backgroundsDir)) {
            return res.json([]);
        }
        const backgroundFiles = fs.readdirSync(backgroundsDir)
            .filter(file => /\.(jpe?g|png|gif)$/i.test(file))
            .map(file => `backgrounds/${file}`);
        res.json(backgroundFiles);
    } catch (error) {
        console.error('Error reading backgrounds directory:', error);
        res.status(500).send('Error reading backgrounds directory');
    }
});

// API endpoint to get gallery files
app.get('/api/gallery', (req, res) => {
    const photosDir = path.join(__dirname, 'fotos');
    const videosDir = path.join(__dirname, 'video');

    const getFiles = (dir, type) => {
        try {
            // Ensure directory exists
            if (!fs.existsSync(dir)) {
                return [];
            }
            return fs.readdirSync(dir).map(file => ({
                url: `${type}/${file}`,
                type: type.slice(0, -1) // 'fotos' -> 'foto', 'video' -> 'video'
            }));
        } catch (error) {
            console.error(`Error reading ${dir}:`, error);
            return []; // Return empty array on error
        }
    };

    const photos = getFiles(photosDir, 'fotos');
    const videos = getFiles(videosDir, 'video');
    
    res.json([...photos, ...videos]);
});

// Endpoint to save photos
app.post('/api/save-photo', express.json({ limit: '50mb' }), (req, res) => {
    const { dataUrl } = req.body;
    if (!dataUrl) {
        return res.status(400).send('No image data received.');
    }

    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    const fileName = `photobooth_${new Date().getTime()}.jpg`;
    const filePath = path.join(__dirname, 'fotos', fileName);

    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error saving photo:', err);
            return res.status(500).send('Failed to save photo.');
        }
        res.status(200).send({ message: 'Photo saved successfully!', path: `fotos/${fileName}` });
    });
});

// Endpoint to save videos
app.post('/api/save-video', express.raw({ type: 'video/webm', limit: '100mb' }), (req, res) => {
    if (!req.body) {
        return res.status(400).send('No video data received.');
    }

    const fileName = `videobooth_${new Date().getTime()}.webm`;
    const filePath = path.join(__dirname, 'video', fileName);

    fs.writeFile(filePath, req.body, (err) => {
        if (err) {
            console.error('Error saving video:', err);
            return res.status(500).send('Failed to save video.');
        }
        res.status(200).send({ message: 'Video saved successfully!', path: `video/${fileName}` });
    });
});


app.listen(port, () => {
    console.log(`Magic Photo Booth server listening at http://localhost:${port}`);
});
