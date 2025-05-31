import { FC, ReactNode, useState } from "react";
import { ScreenShareContext } from "./ScreenSharingContext.provider";

export type ScreenSharingProviderProps = {
  children: ReactNode;
};

export const ScreenSharingProvider: FC<ScreenSharingProviderProps> = ({
  children,
}) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPageReloaded, setIsPageReloaded] = useState(false);
  const [startScreenSharing, setStartScreenSharing] = useState(false);

  return (
    <ScreenShareContext.Provider
      value={{
        isScreenSharing,
        setIsScreenSharing,
        isPageReloaded,
        setIsPageReloaded,
        startScreenSharing,
        setStartScreenSharing,
      }}
    >
      {children}
    </ScreenShareContext.Provider>
  );
};
