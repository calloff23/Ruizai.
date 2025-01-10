const uploadButton = document.getElementById('uploadButton');
const remixButton = document.getElementById('remixButton');
const downloadButton = document.getElementById('downloadButton');
const audioFileInput = document.getElementById('audioFile');
const downloadLink = document.getElementById('downloadLink');
const status = document.getElementById('status');

let audioContext, audioBuffer;

// Upload File Button
uploadButton.addEventListener('click', () => {
    audioFileInput.click();
});

audioFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        status.textContent = "Loading audio file...";
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                audioBuffer = buffer;
                status.textContent = "Audio file loaded. Ready to remix!";
                remixButton.disabled = false;
            });
        };
        reader.readAsArrayBuffer(file);
    }
});

// Remix File Button
remixButton.addEventListener('click', () => {
    if (!audioBuffer) {
        status.textContent = "Please upload a valid MP3 file.";
        return;
    }

    status.textContent = "Remixing audio...";
    const remixedBuffer = remixAudio(audioBuffer);

    remixedBuffer.then((renderedBuffer) => {
        exportAudio(renderedBuffer).then((remixedBlob) => {
            const url = URL.createObjectURL(remixedBlob);
            downloadLink.href = url;
            downloadLink.style.display = 'inline';
            downloadButton.disabled = false;
            status.textContent = "Remix complete! Download your remixed MP3.";
        });
    });
});

// Download File Button
downloadButton.addEventListener('click', () => {
    downloadLink.click();
});

function remixAudio(buffer) {
    const offlineContext = new OfflineAudioContext(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Add remix effects
    const playbackRate = Math.random() * 0.5 + 0.75; // Random playback rate (0.75x - 1.25x)
    source.playbackRate.value = playbackRate;

    const gainNode = offlineContext.createGain();
    gainNode.gain.value = 1.5; // Volume boost

    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    source.start(0);
    return offlineContext.startRendering();
}

async function exportAudio(renderedBuffer) {
    const audioBlob = await audioBufferToWav(renderedBuffer);
    return audioBlob;
}

function audioBufferToWav(buffer) {
    return new Promise((resolve) => {
        const worker = new Worker(/* Wave conversion worker script */);
        worker.postMessage([buffer]);
        worker.onmessage = (e) => resolve(new Blob([e.data], { type: 'audio/wav' }));
    });
}
