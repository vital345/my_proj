import { useContext } from "react";
import { LiveAPIContext } from "../module/contexts/LiveAPIContext.provider";

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error("useLiveAPIContext must be used wihin a LiveAPIProvider");
  }
  return context;
};