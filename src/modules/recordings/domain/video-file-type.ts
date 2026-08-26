import { InvalidVideoFileError } from "@/modules/recordings/domain/errors";

export type AllowedVideoType = {
  readonly mimeType: string;
  readonly extension: string;
};

/** The only container formats admins may upload. */
export const ALLOWED_VIDEO_TYPES: readonly AllowedVideoType[] = [
  { mimeType: "video/mp4", extension: "mp4" },
  { mimeType: "video/quicktime", extension: "mov" },
  { mimeType: "video/webm", extension: "webm" },
  { mimeType: "video/x-matroska", extension: "mkv" },
];

export const ALLOWED_VIDEO_MIME_TYPES = ALLOWED_VIDEO_TYPES.map((type) => type.mimeType);

export const ALLOWED_VIDEO_EXTENSIONS = ALLOWED_VIDEO_TYPES.map((type) => type.extension);

export function extensionOf(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

/**
 * Sniff the container from the first bytes of the file. The declared MIME type
 * and the extension are both attacker-controlled, so neither is trusted; this
 * is the check that actually decides whether the bytes are a video.
 */
export function sniffVideoContainer(head: Uint8Array): AllowedVideoType | null {
  // ISO-BMFF (MP4 / MOV / M4V): [size:4][ftyp][major brand:4]
  if (
    head.length >= 12 &&
    head[4] === 0x66 &&
    head[5] === 0x74 &&
    head[6] === 0x79 &&
    head[7] === 0x70
  ) {
    const brand = String.fromCharCode(head[8]!, head[9]!, head[10]!, head[11]!);
    const isQuickTime = brand === "qt  ";
    return isQuickTime
      ? { mimeType: "video/quicktime", extension: "mov" }
      : { mimeType: "video/mp4", extension: "mp4" };
  }

  // EBML (WebM / Matroska): 1A 45 DF A3
  if (
    head.length >= 4 &&
    head[0] === 0x1a &&
    head[1] === 0x45 &&
    head[2] === 0xdf &&
    head[3] === 0xa3
  ) {
    return { mimeType: "video/webm", extension: "webm" };
  }

  return null;
}

export type ValidateVideoUploadInput = {
  readonly filename: string;
  readonly declaredMimeType: string;
  readonly sizeBytes: number;
  readonly maxBytes: number;
};

/**
 * Header-level validation, run *before* any bytes are accepted. The byte-level
 * sniff happens once the first chunk lands — see `sniffVideoContainer`.
 */
export function validateVideoUploadRequest(
  input: ValidateVideoUploadInput,
): AllowedVideoType | InvalidVideoFileError {
  if (input.sizeBytes <= 0) {
    return new InvalidVideoFileError("The file is empty.");
  }
  if (input.sizeBytes > input.maxBytes) {
    const maxMb = Math.floor(input.maxBytes / (1024 * 1024));
    return new InvalidVideoFileError(`The file is too large (max ${maxMb} MB).`);
  }

  const extension = extensionOf(input.filename);
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
    return new InvalidVideoFileError(
      `Unsupported file extension. Allowed: ${ALLOWED_VIDEO_EXTENSIONS.join(", ")}.`,
    );
  }

  const match = ALLOWED_VIDEO_TYPES.find((type) => type.mimeType === input.declaredMimeType);
  if (!match) {
    return new InvalidVideoFileError(
      `Unsupported video type. Allowed: ${ALLOWED_VIDEO_MIME_TYPES.join(", ")}.`,
    );
  }

  return match;
}
