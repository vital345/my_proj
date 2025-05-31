import { useEffect, useRef, useState } from "react";

const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    const getCameraFeed = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setPermissionError(true);
      }
    };

    getCameraFeed();
  }, []);

  return !permissionError ? (
    <video ref={videoRef} autoPlay className="rounded-lg shadow-lg" />
  ) : (
    <div
      className="glass-background"
      style={{
        alignSelf: "center",
        padding: "1.25rem",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p style={{ margin: "auto", textAlign: "center" }}>
        User has denied video permission
      </p>
    </div>
  );
};

export default CameraFeed;
