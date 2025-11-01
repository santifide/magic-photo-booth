const { spawn } = require('child_process');
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

// Endpoint to take a photo with the DSLR
app.post('/api/take-dslr-photo', (req, res) => {
    const fileName = `dslr_${new Date().getTime()}.jpg`;
    const filePath = path.join(__dirname, 'fotos', fileName);
    const gphoto2 = spawn('gphoto2', ['--capture-image-and-download', '--filename', filePath]);

    let stderr = '';

    gphoto2.stdout.on('data', (data) => {
        console.log(`gphoto2 stdout: ${data}`);
    });

    gphoto2.stderr.on('data', (data) => {
        console.error(`gphoto2 stderr: ${data}`);
        stderr += data.toString();
    });

    gphoto2.on('close', (code) => {
        if (code === 0) {
            // Poll for the file to exist, with a timeout
            const pollTimeout = 10000; // 10 seconds
            const pollInterval = 200; // 200 ms
            let timeWaited = 0;

            const poll = setInterval(() => {
                if (fs.existsSync(filePath)) {
                    clearInterval(poll);
                    console.log(`Photo taken and saved to ${filePath}`);
                    res.status(200).send({ message: 'Photo saved successfully!', fileName: fileName });
                    
                    // Clean up temporary files from gphoto2
                    fs.readdir(__dirname, (err, files) => {
                        if (err) {
                            console.error('Error reading directory to clean temp files:', err);
                            return;
                        }
                        files.forEach(file => {
                            if (file.startsWith('tmpfile')) {
                                fs.unlink(path.join(__dirname, file), err => {
                                    if (err) {
                                        console.error('Error deleting temp file:', err);
                                    } else {
                                        console.log('Deleted temp file:', file);
                                    }
                                });
                            }
                        });
                    });

                } else {
                    timeWaited += pollInterval;
                    if (timeWaited >= pollTimeout) {
                        clearInterval(poll);
                        console.error('gphoto2 command executed, but file was not created in time.');
                        res.status(500).send('Failed to save photo after capture.');
                    }
                }
            }, pollInterval);

        } else {
            console.error(`gphoto2 process exited with code ${code}. stderr: ${stderr}`);
            if (stderr.includes('No camera found')) {
                return res.status(500).send('No camera detected. Make sure it is connected and not claimed by another application.');
            }
            res.status(500).send(`Failed to take picture: ${stderr}`);
        }
    });

    gphoto2.on('error', (err) => {
        console.error('Failed to start gphoto2 process.', err);
        res.status(500).send('Failed to start gphoto2 process.');
    });
});

// Endpoint to serve a specific photo
app.get('/api/photo/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'fotos', filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Photo not found.');
    }
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
