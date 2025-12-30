require('dotenv').config();
const { spawn } = require('child_process');
const express = require('express');
const fs = require('fs');
const path = require('path');

const { OpenAI } = require('openai');
const fetch = require('node-fetch'); // Para descargar la imagen generada

const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- CONFIGURACIÓN DE ESTILOS IA ---
const STYLES = [
    {
        id: 'pixar',
        name: 'Pixar 3D',
        description: 'Acabado suave, ojos grandes y luz cinematográfica.',
        prompt: "High-quality 3D animation style, Pixar and Disney inspired, cute character design, big expressive eyes, smooth skin textures, cinematic soft lighting, vibrant colors, detailed hair grooming, 8k resolution, charming and friendly atmosphere."
    },
    {
        id: 'cyber-chic',
        name: 'Cyber-Chic / Neon',
        description: 'Futurista, luces neón y texturas brillantes.',
        prompt: "Cyber-chic 3D stylized character, futuristic 15th birthday celebration theme, glowing neon accents on clothing, bioluminescent party decorations, dark urban background with vibrant pink and teal neon lights, glossy textures, volumetric lighting, digital art masterpiece."
    },
    {
        id: 'spider-verse',
        name: 'Spider-Verse',
        description: 'Cómic dinámico, texturas de papel y estilo urbano.',
        prompt: "Spider-man Into the Spider-Verse style, stylized comic book art, halftone patterns, Ben-Day dots, chromatic aberration, vibrant street art aesthetic, expressive ink lines, dynamic pose, urban graffiti background, unique painterly texture."
    },
    {
        id: 'ghibli',
        name: 'Studio Ghibli',
        description: 'Anime clásico, pintado a mano y atmósfera pacífica.',
        prompt: "Studio Ghibli anime style, hand-drawn aesthetic, watercolor textures, lush detailed nature backgrounds, soft pastel colors, peaceful and magical atmosphere, Hayao Miyazaki inspired, high-quality traditional cel animation look."
    },
    {
        id: 'funko',
        name: 'Funko Pop',
        description: 'Figura coleccionable de cabeza grande y ojos de botón.',
        prompt: "Funko Pop vinyl figure style, oversized square head, large black button eyes, small body, standing on a clear plastic base, stylized miniature character, clean 3D render, studio lighting, toy photography aesthetic, solid color background."
    }
];

// API endpoint to get available styles
app.get('/api/styles', (req, res) => {
    res.json(STYLES);
});

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
            const allowedExtensions = {
                'fotos': ['.jpg', '.jpeg', '.png', '.gif'],
                'video': ['.webm', '.mp4']
            };
            return fs.readdirSync(dir)
                .filter(file => {
                    if (file === '.gitkeep') {
                        return false;
                    }
                    const ext = path.extname(file).toLowerCase();
                    return allowedExtensions[type].includes(ext);
                })
                .map(file => ({
                    url: `${type}/${file}`,
                    type: type === 'fotos' ? 'foto' : 'video' // Corrected logic
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

// Endpoint to apply AI style to a photo
app.post('/api/apply-style', express.json(), async (req, res) => {
    const { filename, styleId } = req.body;

    if (!filename || !styleId) {
        return res.status(400).send('Filename and styleId are required.');
    }

    const sourcePath = path.join(__dirname, 'fotos', filename);
    if (!fs.existsSync(sourcePath)) {
        return res.status(404).send('Source photo not found.');
    }

    const selectedStyle = STYLES.find(s => s.id === styleId);
    if (!selectedStyle) {
        return res.status(400).send('Invalid style ID.');
    }

    try {
        console.log(`Applying style "${selectedStyle.name}" to ${filename}...`);
        
        // Lógica de generación de imagen
        // Aquí llamamos a la función que conecta con la IA
        const newFileName = `ai_${styleId}_${new Date().getTime()}.jpg`;
        const destPath = path.join(__dirname, 'fotos', newFileName);

        await generateImageWithAI(sourcePath, destPath, selectedStyle.prompt);

        res.json({ 
            message: 'Style applied successfully!', 
            path: `fotos/${newFileName}`,
            original: filename
        });

    } catch (error) {
        console.error('Error applying style:', error.message);
        // Enviamos el mensaje de error específico en formato JSON para que el frontend lo muestre
        res.status(500).json({ message: error.message });
    }
});

// Helper function to handle AI generation
async function generateImageWithAI(sourcePath, destPath, prompt) {
    // --- INTEGRACIÓN REAL CON OPENAI (DALL-E 3) ---
    // NOTA IMPORTANTE: El modelo DALL-E 3 (usado en `images.generate`) es un modelo de TEXTO-a-IMAGEN.
    // Esto significa que IGNORARÁ la foto original (sourcePath) y creará una imagen COMPLETAMENTE NUEVA
    // basada únicamente en la descripción del prompt. El resultado será un personaje con el estilo
    // que pediste, pero NO se parecerá a la persona de la foto original.
    // Esta es la forma más sencilla de integrarlo. Para una edición real (imagen-a-imagen),
    // se requieren modelos o APIs más complejas.

    console.log('Generating image with DALL-E 3...');
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1, // Generar una sola imagen
            size: "1024x1024", // DALL-E 3 soporta "1024x1024", "1792x1024", o "1024x1792"
            quality: "standard", // o "hd" para mayor detalle (y costo)
        });

        const imageUrl = response.data[0].url;
        console.log('Image generated, URL:', imageUrl);

        // Descargar la imagen desde la URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.statusText}`);
        }

        // Guardar la imagen en el disco
        const imageBuffer = await imageResponse.buffer();
        fs.writeFileSync(destPath, imageBuffer);
        
        console.log(`Image saved to ${destPath}`);
        return destPath;

    } catch (error) {
        console.error('OpenAI Error Details:', error); // Log detallado para el administrador

        let userMessage = 'Error desconocido al generar la imagen.';

        // 1. Errores específicos de la API de OpenAI
        if (error.status) {
            switch (error.status) {
                case 401:
                    userMessage = 'Error de autenticación: La API Key es incorrecta o no válida. Revisa tu archivo .env';
                    break;
                case 429:
                    userMessage = 'Límite excedido o sin crédito: Verifica tu saldo en OpenAI (Billing).';
                    break;
                case 500:
                case 503:
                    userMessage = 'Servidores de OpenAI saturados. Intenta de nuevo en unos segundos.';
                    break;
                default:
                    userMessage = `Error de OpenAI (${error.status}): ${error.message}`;
            }
        } 
        // 2. Errores de Red (Sin internet, DNS, Timeout)
        else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            userMessage = 'Error de conexión: No hay internet o no se puede conectar con OpenAI.';
        }
        // 3. Otros errores
        else {
            userMessage = `Error: ${error.message}`;
        }

        throw new Error(userMessage);
    }
}

app.listen(port, () => {
    console.log(`Magic Photo Booth server listening at http://localhost:${port}`);
});
