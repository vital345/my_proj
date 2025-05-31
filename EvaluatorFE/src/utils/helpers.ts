import SyntaxHighlighter, {
  SyntaxHighlighterProps,
} from "react-syntax-highlighter";
import { toast } from "react-toastify";

export const blobToBase64 = (blob: Blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob); // Converts blob to Base64
  });
};

export const base64ToBlob = (
  base64Data: string,
  contentType = "audio/mpeg"
) => {
  const byteCharacters = atob(base64Data.split(",")[1]); // Remove data URL prefix
  const byteArrays: Uint8Array[] = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
};

export const convertToObj = (stringArg: string): [boolean, any] => {
  try {
    const parsedObj = JSON.parse(stringArg);
    return [true, parsedObj];
  } catch (err) {
    console.log({ err });
    return [false, stringArg];
  }
};

export const padNumber = (num: number) => {
  if (num < 10) {
    return `0${num}`;
  }

  return num;
};

export const SyntaxhighlighterCustom =
  SyntaxHighlighter as unknown as React.FC<SyntaxHighlighterProps>;

// Get combined stream with improved audio mixing
export const getCombinedStream = async (onStopCallback: Function) => {
  try {
    // Get screen stream with audio
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "monitor",
        frameRate: 30, // Consistent framerate
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: true,
    });

    // Get microphone stream
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Check if we're sharing the right surface
    const videoTrack = screenStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    // Register callback for when screen sharing stops
    videoTrack.onended = () => {
      onStopCallback();
    };

    if (settings.displaySurface !== "monitor") {
      toast.error(
        "Only entire screen should be shared, reload to start quiz again"
      );
      screenStream.getTracks().forEach((track) => track.stop());
      micStream.getTracks().forEach((track) => track.stop());
      return null;
    }

    // Create audio mixer
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Add microphone audio
    const micGain = audioContext.createGain();
    micGain.gain.value = 0.7; // Reduce mic volume slightly
    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(micGain);
    micGain.connect(destination);

    // Add screen audio if available
    if (screenStream.getAudioTracks().length > 0) {
      const screenSource = audioContext.createMediaStreamSource(screenStream);
      const screenGain = audioContext.createGain();
      screenGain.gain.value = 0.8; // Reduce system audio slightly
      screenSource.connect(screenGain);
      screenGain.connect(destination);
    }

    // Combine video and mixed audio into one stream
    const combinedStream = new MediaStream([
      ...screenStream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ]);

    return combinedStream;
  } catch (error) {
    console.error("Error getting combined stream:", error);
    throw error;
  }
};
