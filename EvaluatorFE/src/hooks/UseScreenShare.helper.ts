import { VideoUploadStateType } from "./UseScreenShare.types";

export const getInitialUploadState = () => {
  return {
    uploadId: null,
    key: null,
    parts: [],
    buffer: [],
    bufferSize: 0,
    partNumber: 1,
    isIncompleted: false,
    pendingUpload: [],
  } as VideoUploadStateType;
};
