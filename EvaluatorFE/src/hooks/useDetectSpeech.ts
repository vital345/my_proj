import { useMicVAD } from "@ricky0123/vad-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PAUSING_THRESHOLD } from "../components/EvaluationBotAudio/EvaluationBotAudio.constants";

export const useDetectSpeech = ({
  stopRecording,
  isTextDialogOpen,
  startRecording,
  isQuestionFinishedPlaying,
}: {
  stopRecording: (arg: boolean) => void;
  isTextDialogOpen: boolean;
  startRecording: boolean;
  isQuestionFinishedPlaying: boolean;
}) => {
  const vad = useMicVAD({
    onSpeechEnd: () => {
      // console.log("User stopped talking");
    },
  });
  const [hasSpoke, setHasSpoke] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTextDialogOpenRef = useRef(isTextDialogOpen);

  const setCustomTimeout = useCallback(() => {
    const clearTimeoutIntervals = () => {
      if (intervalRef.current && hasSpoke) {
        clearTimeout(intervalRef.current);
      }
    };

    if (intervalRef.current) clearTimeout(intervalRef.current);

    intervalRef.current = setTimeout(() => {
      stopRecording(isTextDialogOpenRef.current);
      clearTimeoutIntervals();
    }, PAUSING_THRESHOLD);
  }, [hasSpoke, stopRecording]);

  useEffect(() => {
    if (!isQuestionFinishedPlaying) return;
    if (startRecording && vad.userSpeaking) {
      // console.log("[user started speaking]");
      setHasSpoke(true);
      setCustomTimeout();
    }
  }, [
    startRecording,
    vad.userSpeaking,
    isQuestionFinishedPlaying,
    setCustomTimeout,
  ]);

  return {
    setHasSpoke,
    hasSpoke,
  };
};
