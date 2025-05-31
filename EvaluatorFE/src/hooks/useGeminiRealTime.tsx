import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import cn from "classnames";
import { useEffect, useState } from "react";
import { AudioRecorder } from "../module/lib/audio-recorder";
import { useLiveAPIContext } from "./useLiveAPI";

export const useGeminiRealTime = () => {
  const [inVolume, setInVolume] = useState(0);
  const [muted, setMuted] = useState(false);
  const [audioRecorder] = useState(() => new AudioRecorder());

  const { client, connected, setConfig, config, setConnected, volume } =
    useLiveAPIContext();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = ({ arrayBuffer }: { arrayBuffer: string }) => {
      client.send(arrayBuffer);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, audioRecorder, muted]);

  const renderMuteUnmuteButton = () => {
    return (
      <>
        <button
          className={cn("action-button mic-button")}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">
              <MicIcon />
            </span>
          ) : (
            <span className="material-symbols-outlined filled">
              <MicOffIcon />
            </span>
          )}
        </button>
        <p>{!muted ? "Microphone On" : "Microphone Off"}</p>
      </>
    );
  };

  return {
    client,
    connected,
    setConfig,
    config,
    setConnected,
    renderMuteUnmuteButton,
    volume,
  };
};
