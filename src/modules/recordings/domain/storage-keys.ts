/**
 * Storage keys are opaque, server-generated, POSIX-style paths relative to the
 * private media root. They never contain user-supplied path segments, which is
 * what keeps path traversal off the table.
 */

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

/** True when every segment is safe and the key contains no traversal. */
export function isSafeStorageKey(key: string): boolean {
  if (key.length === 0 || key.length > 512) return false;
  if (key.startsWith("/") || key.includes("\\") || key.includes("\0")) return false;
  return key.split("/").every((segment) => segment !== ".." && SAFE_SEGMENT.test(segment));
}

/** Strip everything unsafe out of a filename before it is echoed back to a user. */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "video";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 120) || "video";
}

export function originalVideoKey(assetId: string, extension: string): string {
  const ext = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `videos/${assetId}/original.${ext}`;
}

export function hlsPrefixKey(assetId: string): string {
  return `videos/${assetId}/hls`;
}

export function thumbnailKey(assetId: string): string {
  return `videos/${assetId}/thumbnail.jpg`;
}

export function assetPrefixKey(assetId: string): string {
  return `videos/${assetId}`;
}

export function uploadSessionKey(uploadId: string): string {
  return `uploads/${uploadId}/part`;
}

export function uploadSessionPrefix(uploadId: string): string {
  return `uploads/${uploadId}`;
}
