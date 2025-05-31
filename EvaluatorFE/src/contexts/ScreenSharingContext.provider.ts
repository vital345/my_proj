import  { createContext } from "react";

export type ScreenShareContextType = {
  isScreenSharing: boolean;
  setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>;
  isPageReloaded: boolean;
  setIsPageReloaded: React.Dispatch<React.SetStateAction<boolean>>;
  startScreenSharing: boolean;
  setStartScreenSharing: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ScreenShareContext = createContext<ScreenShareContextType>({
  isScreenSharing: false,
  setIsScreenSharing: () => {},
  isPageReloaded: false,
  setIsPageReloaded: () => {},
  startScreenSharing: false,
  setStartScreenSharing: () => {},
});
