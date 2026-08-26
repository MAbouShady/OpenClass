/**
 * Private media storage port.
 *
 * The local-disk implementation is what ships today, but the interface is
 * deliberately shaped around object storage (opaque keys, prefix deletes,
 * an upload-authorization step) so an S3/MinIO adapter — and with it presigned
 * direct-to-storage uploads and a CDN in front — can be dropped in without any
 * caller changing.
 */
export type StoredObjectRange = {
  readonly start: number;
  readonly end: number;
};

export type StoredObjectStat = {
  readonly sizeBytes: number;
};

export type UploadAuthorization = {
  readonly uploadId: string;
  /**
   * Where the client should send bytes. For local storage this is our own
   * chunk endpoint; an object-storage adapter would return a presigned URL.
   */
  readonly uploadUrl: string;
  readonly strategy: "chunked-proxy" | "presigned";
  readonly expiresAt: Date;
};

export interface MediaStorage {
  /** Begin a resumable upload. Storage credentials never leave the server. */
  createUpload(uploadId: string): Promise<void>;
  /** Append one chunk. Chunks must arrive in order; out-of-order chunks are rejected. */
  appendChunk(uploadId: string, offset: number, chunk: Uint8Array): Promise<number>;
  /** Read the first `length` bytes already received, for container sniffing. */
  readUploadHead(uploadId: string, length: number): Promise<Uint8Array>;
  uploadedBytes(uploadId: string): Promise<number>;
  /** Move a finished upload to its permanent key. */
  finalizeUpload(uploadId: string, key: string): Promise<void>;
  abortUpload(uploadId: string): Promise<void>;

  stat(key: string): Promise<StoredObjectStat | null>;
  read(key: string, range?: StoredObjectRange): Promise<Uint8Array>;
  exists(key: string): Promise<boolean>;
  deleteObject(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;

  /**
   * Produce a local filesystem path for a stored object so the transcoder can
   * read it. An object-storage adapter downloads to a temp file here.
   */
  materialize(
    key: string,
  ): Promise<{ readonly path: string; readonly cleanup: () => Promise<void> }>;
  /** Publish a locally produced directory tree (the HLS output) under a prefix. */
  putDirectory(localDir: string, prefix: string): Promise<void>;
  putObject(key: string, data: Uint8Array): Promise<void>;
}
