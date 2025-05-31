import { SESSION_STORAGE_KEYS } from "./EvaluationBotAudio.constants";

export const playBase64Audio = (base64Audio: string) => {
  if (base64Audio) {
    // Decode the Base64 string
    const audioBytes = atob(base64Audio);
    const audioBuffer = new Uint8Array(audioBytes.length);

    for (let i = 0; i < audioBytes.length; i++) {
      audioBuffer[i] = audioBytes.charCodeAt(i);
    }

    // Create a Blob from the audio buffer
    const audioBlob = new Blob([audioBuffer], { type: "audio/mp3" });

    // Create an audio URL from the Blob and play it
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.muted = false;
    audio.play();
  }
};

export const visualizeRecording = (
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  analyserRef: React.MutableRefObject<AnalyserNode | null>
) => {
  const canvas = canvasRef.current;
  const analyser = analyserRef.current;
  if (!canvas || !analyser) return;

  const canvasCtx = canvas.getContext("2d");
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    if (canvasCtx) {
      canvasCtx.fillStyle = "whitesmoke";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "#1b849b"; // Blue color for the waveform

      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    }
  };

  draw();
};

export const setIfPageReloaded = () => {
  sessionStorage.setItem(SESSION_STORAGE_KEYS.IS_RELOADED, "true");
};

export const showResumeIfPageReloaded = () => {
  if (sessionStorage.getItem(SESSION_STORAGE_KEYS.IS_RELOADED)) {
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.IS_RELOADED);
    return true;
  }

  return false;
};