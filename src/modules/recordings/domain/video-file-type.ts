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

/**
 * What the file picker filters on.
 *
 * Extensions are listed alongside the MIME types on purpose. A browser only
 * matches a MIME type in `accept` when the operating system maps the extension
 * to it, and Windows frequently maps `.mkv` and `.mov` to nothing at all — on
 * those machines a MIME-only filter greys the file out and the teacher cannot
 * even select it. The extensions make the picker work everywhere.
 */
export const VIDEO_ACCEPT_ATTRIBUTE = [
  ...ALLOWED_VIDEO_TYPES.map((type) => type.mimeType),
  ...ALLOWED_VIDEO_TYPES.map((type) => `.${type.extension}`),
].join(",");

export function typeForExtension(extension: string): AllowedVideoType | null {
  return ALLOWED_VIDEO_TYPES.find((type) => type.extension === extension) ?? null;
}

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
    return readEbmlDocType(head) === "matroska"
      ? { mimeType: "video/x-matroska", extension: "mkv" }
      : { mimeType: "video/webm", extension: "webm" };
  }

  return null;
}

/**
 * The DocType string inside the EBML header, which is the only thing that
 * separates a WebM from an MKV. Both share the same magic number, so without
 * this every Matroska file would be stored and labelled as WebM.
 *
 * Element id 0x4282, then a single-byte length, then ASCII. Returns null when
 * the head is too short or the element is not where it is expected.
 */
function readEbmlDocType(head: Uint8Array): string | null {
  for (let i = 4; i + 2 < head.length; i += 1) {
    if (head[i] !== 0x42 || head[i + 1] !== 0x82) continue;

    const length = head[i + 2]! & 0x7f;
    const start = i + 3;
    if (length === 0 || start + length > head.length) return null;

    let value = "";
    for (let j = start; j < start + length; j += 1) value += String.fromCharCode(head[j]!);
    return value;
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

  const byExtension = typeForExtension(extensionOf(input.filename));
  if (!byExtension) {
    return new InvalidVideoFileError(
      `Unsupported file extension. Allowed: ${ALLOWED_VIDEO_EXTENSIONS.join(", ")}.`,
    );
  }

  // The declared MIME type comes from the operating system's extension
  // registry, not from the bytes, so it is missing or wrong on plenty of
  // healthy machines: Windows reports "" for .mkv and .mov unless a player
  // registered them, and Chrome and Safari disagree about .mov. Rejecting on it
  // locked teachers out of files that were perfectly fine. It is now only used
  // to catch an outright contradiction — an .mp4 announced as application/pdf.
  // Neither this nor the extension is trusted to decide the stored type: that
  // is `sniffVideoContainer`, which reads the actual bytes at completion.
  const declared = input.declaredMimeType.trim().toLowerCase();
  if (declared !== "" && !declared.startsWith("video/") && declared !== "application/octet-stream") {
    return new InvalidVideoFileError(
      `Unsupported video type. Allowed: ${ALLOWED_VIDEO_MIME_TYPES.join(", ")}.`,
    );
  }

  return byExtension;
}
