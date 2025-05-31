import { createContext } from "react";
import { UseLiveAPIResults } from "../hooks/use-live-api";

export const LiveAPIContext = createContext<UseLiveAPIResults | undefined>(
  undefined
);
