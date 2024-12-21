// Audio Functions //

async function getAudioDeviceByName(deviceName) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioDevice = devices.find(
    (device) =>
      device.kind === "audioinput" && device.label.includes(deviceName)
  );
  if (audioDevice) {
    return audioDevice.deviceId;
  } else {
    throw new Error(`Audio device with name ${deviceName} not found`);
  }
}

let animFrame;

async function startAudioCapture(
  deviceName,
  fft_size,
  MIN_BAR_HEIGHT,
  FREQUENCY_SHIFT,
  FREQUENCY_ADJUST,
  canvas,
  ctx,
  noise_intensity,
  color
) {
  try {
    if(animFrame) { 
      cancelAnimationFrame(animFrame);
    }

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    const deviceId = await getAudioDeviceByName(deviceName);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    });
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);

    analyser.fftSize = fft_size;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame(first=false) {
      animFrame = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width - 1, canvas.height - 1);

      for (let i = 0; i < bufferLength; i++) {
        const index = Math.min(
          bufferLength - 1,
          Math.max(0, Math.floor((i + FREQUENCY_SHIFT) * FREQUENCY_ADJUST))
        );
        const value = dataArray[index] || 0;
        const noise = (Math.random() - 0.5) * noise_intensity; // Adding noise
        const barHeight =
          Math.max(MIN_BAR_HEIGHT, (value / 255) * canvas.height) + noise;
        const x = i * (canvas.width / bufferLength);
        const y = canvas.height - barHeight;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 2, barHeight);
      }

    }
  
  renderFrame();
  } catch (error) {
    const errorDisplay = document.createElement("div");
    errorDisplay.style.color = "red";
    errorDisplay.innerText = `Error capturing system audio: ${error.message}`;
    document.body.appendChild(errorDisplay);
  }
}

// After Loaded //

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("visualizer");
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Unable to get 2D context!");
    return;
  }

  const FREQUENCY_SHIFT = 0;
  const FREQUENCY_ADJUST = 2;
  const MIN_BAR_HEIGHT = 100;

  var fft_size = 256;

  var noise_intensity = 10;

  var color = (255, 255, 255, 1);

  // Listen for toggle drag message from the main process
  window.electron.ipcRenderer.on("drag-state", (event, drag_state) => {
    cancelAnimationFrame(animFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (drag_state == true) {
      document.body.classList.add("draggable");
    } else {
      startAudioCapture(
        deviceName,
        fft_size,
        MIN_BAR_HEIGHT,
        FREQUENCY_SHIFT,
        FREQUENCY_ADJUST,
        canvas,
        ctx,
        noise_intensity,
        color
      );
      document.body.classList.remove("draggable");
    }
  });

  window.electron.ipcRenderer.on("color-selected", (event, value) => {
    color = value;
    startAudioCapture(
      deviceName,
      fft_size,
      MIN_BAR_HEIGHT,
      FREQUENCY_SHIFT,
      FREQUENCY_ADJUST,
      canvas,
      ctx,
      noise_intensity,
      color
    );
  });

  window.electron.ipcRenderer.on("noise-change", (event, value) => {
    noise_intensity = value;
    startAudioCapture(
      deviceName,
      fft_size,
      MIN_BAR_HEIGHT,
      FREQUENCY_SHIFT,
      FREQUENCY_ADJUST,
      canvas,
      ctx,
      noise_intensity,
      color
    );
  });

  window.electron.ipcRenderer.on("resolution-change", (event, value) => {
    fft_size = value;
    startAudioCapture(
      deviceName,
      fft_size,
      MIN_BAR_HEIGHT,
      FREQUENCY_SHIFT,
      FREQUENCY_ADJUST,
      canvas,
      ctx,
      noise_intensity,
      color
    );
  });

  window.electron.ipcRenderer.send("log", "IPC communication initialized");

  // Capture Internal Audio from Blackhole
  const deviceName = "BlackHole 2ch";


  window.electron.ipcRenderer.send("Load-Settings-Data-Request");
  
  window.electron.ipcRenderer.on("Start-Up-Data", (event, data) => {
    console.log(data);

    color = data.color || color;

    fft_size = data.resolution || fft_size;

    noise_intensity = data.noiseIntensity|| noise_intensity;

    startAudioCapture(
      deviceName,
      fft_size,
      MIN_BAR_HEIGHT,
      FREQUENCY_SHIFT,
      FREQUENCY_ADJUST,
      canvas,
      ctx,
      noise_intensity,
      color
    );
  });


  window.electron.ipcRenderer.on("Settings-Data-Request", () => {
    window.electron.ipcRenderer.send("Settings-Data-Transfer", [color, noise_intensity, fft_size]);

  });
});
