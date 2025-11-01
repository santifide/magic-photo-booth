document.addEventListener('DOMContentLoaded', () => {
    // Main menu elements
    const startButton = document.getElementById('start-button');
    const mainMenu = document.getElementById('main-menu');
    const takePhotoButton = document.getElementById('take-photo-btn');
    const recordVideoButton = document.getElementById('record-video-btn');
    const viewGalleryButton = document.getElementById('view-gallery-btn');

    // Photo booth elements
    const photoBooth = document.getElementById('photo-booth');
    const webcamVideo = document.getElementById('webcam');
    const countdownElement = document.getElementById('countdown');
    const flashElement = document.getElementById('flash');
    const canvas = document.getElementById('canvas');
    const photoPreview = document.getElementById('photo-preview');
    const photoOptions = document.getElementById('photo-options');
    const printButton = document.getElementById('print-btn');
    const deleteButton = document.getElementById('delete-btn');
    const saveButton = document.getElementById('save-btn');

    // Video booth elements
    const videoBooth = document.getElementById('video-booth');
    const videoWebcam = document.getElementById('video-webcam');
    const videoCountdownElement = document.getElementById('video-countdown');
    const recordingTimerElement = document.getElementById('recording-timer');
    const videoControls = document.getElementById('video-controls');
    const pauseResumeButton = document.getElementById('pause-resume-btn');
    const stopButton = document.getElementById('stop-btn');
    const addTimeButton = document.getElementById('add-time-btn');
    const videoPreview = document.getElementById('video-preview');
    const videoOptions = document.getElementById('video-options');
    const playButton = document.getElementById('play-btn');
    const saveVideoButton = document.getElementById('save-video-btn');
    const discardVideoButton = document.getElementById('discard-video-btn');
    const cancelVideoButton = document.getElementById('cancel-video-btn');

    // Gallery elements
    const galleryView = document.getElementById('gallery-view');
    const galleryGrid = document.getElementById('gallery-grid');
    const backToMenuButton = document.getElementById('back-to-menu-btn');

    // Settings modal elements
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const slideshowIntervalInput = document.getElementById('slideshow-interval');
    const photoCountdownInput = document.getElementById('photo-countdown');
    const videoDurationInput = document.getElementById('video-duration');
    const cameraChoiceSelect = document.getElementById('camera-choice');
    const enablePrintingCheckbox = document.getElementById('enable-printing');

    // Background slideshow element
    const backgroundSlideshow = document.getElementById('background-slideshow');

    // State variables
    let mediaRecorder;
    let recordedChunks = [];
    let recordingTimer;
    let recordingDuration;
    let videoBlob;
    let backgroundInterval;

    // Default settings
    const settings = {
        slideshowInterval: 5, // seconds
        photoCountdown: 5, // seconds
        videoDuration: 30, // seconds
        camera: 'webcam',
        enablePrinting: false,
    };

    // --- INITIALIZATION ---
    loadSettingsIntoForm();
    startBackgroundSlideshow();
    updatePrintingButtonVisibility();


    // Go to main menu
    startButton.addEventListener('click', () => {
        startButton.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        mainMenu.classList.add('flex', 'flex-col', 'items-center');
    });

    // --- SETTINGS MODAL LOGIC ---
    hamburgerMenu.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    function loadSettingsIntoForm() {
        slideshowIntervalInput.value = settings.slideshowInterval;
        photoCountdownInput.value = settings.photoCountdown;
        videoDurationInput.value = settings.videoDuration;
        cameraChoiceSelect.value = settings.camera;
        enablePrintingCheckbox.checked = settings.enablePrinting;
    }

    function updateSettings() {
        settings.slideshowInterval = parseInt(slideshowIntervalInput.value, 10);
        settings.photoCountdown = parseInt(photoCountdownInput.value, 10);
        settings.videoDuration = parseInt(videoDurationInput.value, 10);
        settings.camera = cameraChoiceSelect.value;
        settings.enablePrinting = enablePrintingCheckbox.checked;
        
        updatePrintingButtonVisibility();
        
        // Restart background slideshow with new interval
        clearInterval(backgroundInterval);
        startBackgroundSlideshow();
    }
    
    function updatePrintingButtonVisibility() {
        if (settings.enablePrinting) {
            printButton.classList.remove('hidden');
        } else {
            printButton.classList.add('hidden');
        }
    }

    [slideshowIntervalInput, photoCountdownInput, videoDurationInput, cameraChoiceSelect, enablePrintingCheckbox].forEach(el => {
        el.addEventListener('change', updateSettings);
    });


    // --- PHOTO BOOTH LOGIC ---
    takePhotoButton.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        photoBooth.classList.remove('hidden');
        photoBooth.classList.add('flex');
        startPhotoWebcam();
    });

    async function startPhotoWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            webcamVideo.srcObject = stream;
            webcamVideo.classList.remove('hidden');
            photoPreview.classList.add('hidden');
            photoOptions.classList.add('hidden');
            startPhotoCountdown();
        } catch (err) {
            console.error("Error accessing webcam: ", err);
            backToMainMenu();
        }
    }

    function startPhotoCountdown() {
        let count = settings.photoCountdown;
        countdownElement.textContent = count;
        countdownElement.classList.remove('hidden');

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = count;
            } else {
                countdownElement.classList.add('hidden');
                clearInterval(interval);
                takePhoto();
            }
        }, 1000);
    }

    function takePhoto() {
        flashElement.classList.remove('hidden');
        setTimeout(() => flashElement.classList.add('hidden'), 200);

        const context = canvas.getContext('2d');
        canvas.width = webcamVideo.videoWidth;
        canvas.height = webcamVideo.videoHeight;
        context.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);

        stopStream(webcamVideo.srcObject);
        webcamVideo.classList.add('hidden');

        photoPreview.src = canvas.toDataURL('image/jpeg');
        photoPreview.classList.remove('hidden');
        photoOptions.classList.remove('hidden');
    }

    deleteButton.addEventListener('click', startPhotoWebcam);

    saveButton.addEventListener('click', async () => {
        const dataUrl = photoPreview.src;
        try {
            const response = await fetch('/api/save-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dataUrl }),
            });
            if (!response.ok) {
                throw new Error('Failed to save photo');
            }
            console.log('Photo saved successfully');
        } catch (error) {
            console.error(error);
        }
        backToMainMenu();
    });

    // --- VIDEO BOOTH LOGIC ---
    recordVideoButton.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        videoBooth.classList.remove('hidden');
        videoBooth.classList.add('flex');
        startVideoWebcam();
    });

    async function startVideoWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoWebcam.srcObject = stream;
            videoWebcam.classList.remove('hidden');
            videoPreview.classList.add('hidden');
            videoOptions.classList.add('hidden');
            videoControls.classList.add('hidden');
            startVideoCountdown();
        } catch (err) {
            console.error("Error accessing webcam: ", err);
            backToMainMenu();
        }
    }

    function startVideoCountdown() {
        let count = settings.videoCountdown;
        videoCountdownElement.textContent = count;
        videoCountdownElement.classList.remove('hidden');

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                videoCountdownElement.textContent = count;
            } else {
                videoCountdownElement.classList.add('hidden');
                clearInterval(interval);
                startRecording();
            }
        }, 1000);
    }

    function startRecording() {
        recordedChunks = [];
        const stream = videoWebcam.srcObject;
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
            videoPreview.src = URL.createObjectURL(videoBlob);
            videoWebcam.classList.add('hidden');
            videoControls.classList.add('hidden');
            recordingTimerElement.classList.add('hidden');
            videoPreview.classList.remove('hidden');
            videoOptions.classList.remove('hidden');
        };

        mediaRecorder.start();
        videoControls.classList.remove('hidden');
        startRecordingTimer();
    }

    function startRecordingTimer() {
        recordingDuration = settings.videoDuration;
        recordingTimerElement.textContent = recordingDuration;
        recordingTimerElement.classList.remove('hidden');

        recordingTimer = setInterval(() => {
            recordingDuration--;
            recordingTimerElement.textContent = recordingDuration;
            if (recordingDuration <= 0) {
                stopRecording();
            }
        }, 1000);
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        clearInterval(recordingTimer);
    }

    pauseResumeButton.addEventListener('click', () => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            pauseResumeButton.textContent = 'Reanudar';
            clearInterval(recordingTimer);
        } else if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            pauseResumeButton.textContent = 'Pausar';
            startRecordingTimer(); // Resumes the timer logic
        }
    });

    stopButton.addEventListener('click', stopRecording);

    addTimeButton.addEventListener('click', () => {
        recordingDuration += 10;
        recordingTimerElement.textContent = recordingDuration;
    });

    playButton.addEventListener('click', () => {
        videoPreview.play();
    });

    saveVideoButton.addEventListener('click', async () => {
        if (!videoBlob) return;

        try {
            const response = await fetch('/api/save-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'video/webm',
                },
                body: videoBlob,
            });
            if (!response.ok) {
                throw new Error('Failed to save video');
            }
            console.log('Video saved successfully');
        } catch (error) {
            console.error(error);
        }
        backToMainMenu();
    });

    discardVideoButton.addEventListener('click', startVideoWebcam);

    cancelVideoButton.addEventListener('click', () => {
        stopStream(videoWebcam.srcObject);
        backToMainMenu();
    });

    // --- GALLERY LOGIC ---
    viewGalleryButton.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        galleryView.classList.remove('hidden');
        galleryView.classList.add('flex');
        loadGallery();
    });

    backToMenuButton.addEventListener('click', () => {
        galleryView.classList.add('hidden');
        galleryView.classList.remove('flex');
        mainMenu.classList.remove('hidden');
    });

    async function loadGallery() {
        galleryGrid.innerHTML = '';
        try {
            const response = await fetch('/api/gallery');
            if (!response.ok) {
                throw new Error('Failed to load gallery');
            }
            const mediaFiles = await response.json();

            if (mediaFiles.length === 0) {
                galleryGrid.innerHTML = '<p class="text-center col-span-full">La galería está vacía.</p>';
                return;
            }

            mediaFiles.forEach(media => {
                if (media.type === 'foto') {
                    const img = document.createElement('img');
                    img.src = media.url;
                    img.className = 'w-full h-auto object-cover rounded';
                    galleryGrid.appendChild(img);
                } else if (media.type === 'video') {
                    const video = document.createElement('video');
                    video.src = media.url;
                    video.controls = true;
                    video.className = 'w-full h-auto object-cover rounded';
                    galleryGrid.appendChild(video);
                }
            });
        } catch (error) {
            console.error(error);
            galleryGrid.innerHTML = '<p class="text-center col-span-full text-red-500">Error al cargar la galería.</p>';
        }
    }

    // --- BACKGROUND SLIDESHOW LOGIC ---
    async function startBackgroundSlideshow() {
        try {
            const response = await fetch('/api/backgrounds');
            if (!response.ok) {
                throw new Error('Failed to load backgrounds');
            }
            const images = await response.json();

            if (images.length === 0) {
                backgroundSlideshow.style.backgroundColor = 'black';
                return;
            }

            // Clear existing images
            backgroundSlideshow.innerHTML = '';

            let currentImageIndex = 0;
            images.forEach((src, index) => {
                const img = document.createElement('img');
                img.src = src;
                img.className = 'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000';
                img.style.opacity = index === 0 ? '1' : '0';
                backgroundSlideshow.appendChild(img);
            });

            backgroundInterval = setInterval(() => {
                const imageElements = backgroundSlideshow.children;
                if (imageElements.length === 0) return;
                imageElements[currentImageIndex].style.opacity = '0';
                currentImageIndex = (currentImageIndex + 1) % images.length;
                imageElements[currentImageIndex].style.opacity = '1';
            }, settings.slideshowInterval * 1000);

        } catch (error) {
            console.error(error);
            backgroundSlideshow.style.backgroundColor = 'black';
        }
    }


    // --- GENERAL FUNCTIONS ---
    function backToMainMenu() {
        photoBooth.classList.add('hidden');
        videoBooth.classList.add('hidden');
        galleryView.classList.add('hidden');
        galleryView.classList.remove('flex');
        mainMenu.classList.remove('hidden');
        stopStream(webcamVideo.srcObject);
        stopStream(videoWebcam.srcObject);
    }

    function stopStream(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    // Initially hide elements that should not be visible
    // printButton is handled by updatePrintingButtonVisibility
});