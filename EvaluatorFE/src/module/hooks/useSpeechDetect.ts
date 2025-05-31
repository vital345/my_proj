import { useMicVAD } from "@ricky0123/vad-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PAUSING_THRESHOLD } from "../../components/EvaluationBotAudio/EvaluationBotAudio.constants";

export const useSpeechDetection = ({ callBack }: { callBack: () => void }) => {
  const vad = useMicVAD({
    onSpeechEnd: () => {
      console.log("User stopped talking");
    },
  });
  const [hasSpoke, setHasSpoke] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimeoutIntervals = useCallback(() => {
    if (intervalRef.current && hasSpoke) {
      clearTimeout(intervalRef.current);
    }
  }, [hasSpoke]);

  const setCustomTimeout = useCallback(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);

    intervalRef.current = setInterval(() => {
      callBack();
    }, PAUSING_THRESHOLD);
  }, [callBack]);

  useEffect(() => {
    if (vad.userSpeaking) {
      console.log("[Detected Human speech]");
      setHasSpoke(true);
      setCustomTimeout();
    }
  }, [vad.userSpeaking, setCustomTimeout]);

  return {
    setHasSpoke,
    hasSpoke,
    clearTimeoutIntervals,
  };
};
