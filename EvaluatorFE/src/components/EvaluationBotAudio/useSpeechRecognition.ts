import { useRef, useState } from "react";
import { PAUSING_THRESHOLD } from "./EvaluationBotAudio.constants";

export const useSpeechRecognitionHook = ({
  stopRecording,
}: {
  stopRecording: () => void;
}) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const [lastSpeechTime, setLastSpeechTime] = useState<number | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  recognitionRef.current = new SpeechRecognition();
  recognitionRef.current.continuous = true;
  recognitionRef.current.interimResults = true;
  recognitionRef.current.lang = "en-IN";

  const setCustomTimeout = () => {
    if (intervalRef.current) clearTimeout(intervalRef.current);

    intervalRef.current = setTimeout(() => {
      stopRecording();
      clearSpeechToText();
    }, PAUSING_THRESHOLD);
  };

  recognitionRef.current.onstart = () => {
    console.log("started");
    setLastSpeechTime(Date.now());
    setCustomTimeout();
  };

  recognitionRef.current.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");
    console.error("Detected speech: ", transcript, { lastSpeechTime });

    // Update the last speech timestamp
    setLastSpeechTime(Date.now());
    setCustomTimeout();
  };

  recognitionRef.current.onend = () => {
    console.log("Recognition has stopped....");
  };

  const clearSpeechToText = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return {
    intervalRef,
    recognitionRef,
    setLastSpeechTime,
  };
};
