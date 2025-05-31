import { openDB } from "idb";
import { useCallback, useContext, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import conf from "../conf/conf";
import { ScreenShareContext } from "../contexts/ScreenSharingContext.provider";
import { useAppSelector } from "../store/hooks";
import { getCombinedStream } from "../utils/helpers";
import { getInitialUploadState } from "./UseScreenShare.helper";
import { VideoUploadStateType } from "./UseScreenShare.types";

// Constants
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const DB_NAME = "video_uploads";
const STORE_NAME = "uploads";
const SESSION_STORAGE_KEY_PREFIX = "is-video-upload-incomplete";

let videoUploadState: VideoUploadStateType = getInitialUploadState();

// Lock to prevent concurrent uploads
let isUploading = false;

const openDatabase = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

const saveStateToIndexedDB = async (evaluationId: string) => {
  const db = await openDatabase();
  await db.put(STORE_NAME, videoUploadState, evaluationId);
};

const removeStateFromIndexedDB = async (evaluationId: string) => {
  const db = await openDatabase();
  await db.delete(STORE_NAME, evaluationId);
};

const loadStateFromIndexedDB = async (evaluationId: string) => {
  const db = await openDatabase();
  const savedState = await db.get(STORE_NAME, evaluationId);
  if (savedState) {
    videoUploadState = { ...savedState };
  }
};

export const useScreenShare = ({ evaluationId }: { evaluationId: string }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const {
    setIsScreenSharing,
    setIsPageReloaded,
    startScreenSharing,
    setStartScreenSharing,
  } = useContext(ScreenShareContext);
  const { is_complete } = useAppSelector((state) => state.questions);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const token = queryParams.get("token");

  const sessionStorageKey = `${SESSION_STORAGE_KEY_PREFIX}-${evaluationId}`;

  useEffect(() => {
    loadStateFromIndexedDB(evaluationId).then(() => {
      const isPageReloaded = !!JSON.parse(
        sessionStorage.getItem(sessionStorageKey) || "false"
      );
      setIsPageReloaded(isPageReloaded);
      if (!isPageReloaded) {
        setStartScreenSharing(true);
      }
    });

    if (!token) {
      toast.info("Provide token as query parameters");
    }

    window.addEventListener("beforeunload", () => {
      sessionStorage.setItem(sessionStorageKey, "true");
      stopRecording();
    });
  }, []);

  useEffect(() => {
    if (is_complete && videoUploadState.uploadId) {
      completeUpload();
    }
  }, [is_complete, videoUploadState]);

  useEffect(() => {
    if (startScreenSharing && token) {
      startScreenRecord();
    }
  }, [startScreenSharing]);

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsScreenSharing(false);
  };

  // Add this function to handle recovery of pending uploads
  const handlePendingUpload = async () => {
    if (!videoUploadState.pendingUpload?.length) return;

    for (let videoState of videoUploadState.pendingUpload) {
      const { buffer, partNumber } = videoState;

      // If upload was in progress (page reload interrupted it), retry the upload

      try {
        // Create blob and upload
        const blob = new Blob(buffer, { type: "video/webm" });
        const etag = await uploadPart(blob, partNumber);

        // Update parts after successful upload
        videoUploadState.parts.push({
          PartNumber: partNumber,
          ETag: etag || "",
        });

        // Clear pending upload
        videoUploadState.pendingUpload = videoUploadState.pendingUpload.filter(
          (item) => item.partNumber !== partNumber
        );
        await saveStateToIndexedDB(evaluationId);
      } catch (error) {
        console.error("Failed to recover pending upload:", error);
        toast.error(
          "Failed to recover some video data. Recording will continue."
        );
      }
    }
  };

  const startScreenRecord = useCallback(async () => {
    if (videoUploadState.pendingUpload) {
      await handlePendingUpload();
    }

    if (videoUploadState.uploadId && videoUploadState.bufferSize > 0) {
      await completeUpload();
    }

    if (!is_complete) {
      startRecording();
    }
  }, [videoUploadState, is_complete]);

  const initiateUpload = async () => {
    try {
      const response = await fetch(
        `${conf.backendUrl}/recordings/init-upload/?chat_id=${evaluationId}&content_type=video%2Fwebm&file_extension=webm`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return (await response.json()) as { upload_id: string; key: string };
    } catch (error) {
      throw new Error("Failed to initiate upload");
    }
  };

  const getPresignedUrl = async (partNumber: number) => {
    try {
      const response = await fetch(
        `${conf.backendUrl}/recordings/presigned-url/?upload_id=${
          videoUploadState.uploadId
        }&key=${encodeURIComponent(
          videoUploadState?.key || ""
        )}&part_number=${partNumber}`
      );
      return ((await response.json()) as { url: string })?.url;
    } catch (error) {
      throw new Error("Failed to get presigned URL");
    }
  };

  const uploadPart = async (blob: Blob, partNumber: number) => {
    try {
      const presignedUrl = (await getPresignedUrl(partNumber)) as string;
      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "video/webm" },
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.headers.get("ETag");
    } catch (error) {
      throw new Error(`Part upload failed: ${error}`);
    }
  };

  const completeUpload = useCallback(async () => {
    try {
      if (videoUploadState.bufferSize > 0) {
        await uploadIntermediateBlob();
      }

      if (videoUploadState.parts?.length > 0) {
        await fetch(`${conf.backendUrl}/recordings/complete-upload/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            upload_id: videoUploadState.uploadId,
            key: videoUploadState.key,
            parts: videoUploadState.parts,
          }),
        });
      }
      // Clear state after successful completion
      await removeStateFromIndexedDB(evaluationId);
      videoUploadState = getInitialUploadState();
      sessionStorage.setItem(sessionStorageKey, "false");
    } catch (error) {
      throw new Error("Completion failed");
    }
  }, [videoUploadState]);

  // Upload accumulated data
  const uploadIntermediateBlob = useCallback(async () => {
    if (videoUploadState.buffer.length === 0) return;

    // Capture current buffer and part number
    const currentBuffer = [...videoUploadState.buffer];
    const currentPartNumber = videoUploadState.partNumber;

    try {
      // Create a single blob with proper WEBM structure
      const blob = new Blob(currentBuffer, { type: "video/webm" });

      // immediately reset the states
      videoUploadState.buffer = [];
      videoUploadState.bufferSize = 0;
      videoUploadState.partNumber = currentPartNumber + 1;

      if (!videoUploadState.pendingUpload?.length) {
        videoUploadState.pendingUpload = [];
      }

      videoUploadState.pendingUpload.push({
        buffer: currentBuffer,
        partNumber: currentPartNumber,
      });

      // Save updated state till now
      await saveStateToIndexedDB(evaluationId);

      // Upload the blob
      const etag = await uploadPart(blob, currentPartNumber);

      // Update state only after successful upload
      videoUploadState.pendingUpload = videoUploadState.pendingUpload.filter(
        (item) => item.partNumber !== currentPartNumber
      );

      videoUploadState.parts.push({
        PartNumber: currentPartNumber,
        ETag: etag || "",
      });

      // Save updated state
      await saveStateToIndexedDB(evaluationId);
    } catch (error) {
      console.error("Failed to upload intermediate blob:", error);
      // Keep the buffer for retry
      throw error;
    }
  }, [evaluationId, videoUploadState]);

  const processBuffer = useCallback(async () => {
    // Access the current state
    const state = videoUploadState;

    if (state.bufferSize < CHUNK_SIZE || isUploading) return;

    // Set uploading flag to prevent concurrent processing
    isUploading = true;

    try {
      await uploadIntermediateBlob();
    } catch (error) {
      toast.error((error as { message: string }).message as string);
      setIsScreenSharing(false);
    }
    // Reset uploading flag
    isUploading = false;

    // Check if new data accumulated during upload and process
    if (state.bufferSize >= CHUNK_SIZE) {
      await processBuffer();
    }
  }, [uploadIntermediateBlob, videoUploadState]);

  const startRecording = async () => {
    try {
      if (!videoUploadState.uploadId && !is_complete) {
        const { upload_id, key } = await initiateUpload();
        videoUploadState = {
          ...videoUploadState,
          uploadId: upload_id,
          key: key,
        };
      }

      const showLoadingOnStartNowButton = () => {
        setIsScreenSharing(false);
        window.location.reload();
      };

      if (is_complete) return;

      const combinedStream = await getCombinedStream(
        showLoadingOnStartNowButton
      );

      if (!combinedStream) {
        setIsScreenSharing(false);
        return;
      }

      streamRef.current = combinedStream;

      // Create MediaRecorder with improved settings
      // Store reference
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=h264,opus", // Better codec for quality
      });

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          videoUploadState = {
            ...videoUploadState,
            buffer: [...videoUploadState.buffer, event.data],
            bufferSize: videoUploadState.bufferSize + event.data.size,
          };
          await saveStateToIndexedDB(evaluationId);
          await processBuffer();
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stopRecording();
      };

      mediaRecorderRef.current.start(1000);
      setIsScreenSharing(true);
    } catch (error) {
      toast.error((error as { message: string }).message);
      stopRecording();
    }
  };
};
