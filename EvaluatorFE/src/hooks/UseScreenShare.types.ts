export type VideoUploadStateType = {
  uploadId: string | null;
  key: string | null;
  parts: {
    ETag: string;
    PartNumber: number;
  }[];
  buffer: Blob[];
  bufferSize: number;
  partNumber: number;
  pendingUpload: {
    buffer: Blob[];
    partNumber: number;
  }[];
};
