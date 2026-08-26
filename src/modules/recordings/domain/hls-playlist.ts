/**
 * HLS playlists reference their variants and segments by relative URI. Those
 * files are private too, so every reference is rewritten to carry the same
 * short-lived playback token as the playlist request itself. Without this the
 * playlist would be protected while the segments stayed open — the classic
 * half-secured HLS mistake.
 */
export function appendTokenToPlaylist(playlist: string, token: string): string {
  const encodedToken = encodeURIComponent(token);

  return playlist
    .split("\n")
    .map((rawLine) => {
      const line = rawLine.trimEnd();

      // Rewrite URI="..." attributes (EXT-X-MAP, EXT-X-KEY, EXT-X-MEDIA, …).
      if (line.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (match, uri: string) =>
          isAbsolute(uri) ? match : `URI="${withToken(uri, encodedToken)}"`,
        );
      }

      if (line.length === 0 || isAbsolute(line)) return line;

      return withToken(line, encodedToken);
    })
    .join("\n");
}

function isAbsolute(uri: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(uri) || uri.startsWith("//");
}

function withToken(uri: string, encodedToken: string): string {
  const separator = uri.includes("?") ? "&" : "?";
  return `${uri}${separator}t=${encodedToken}`;
}

export function isPlaylistPath(path: string): boolean {
  return path.toLowerCase().endsWith(".m3u8");
}

const HLS_CONTENT_TYPES: Record<string, string> = {
  m3u8: "application/vnd.apple.mpegurl",
  ts: "video/mp2t",
  m4s: "video/iso.segment",
  mp4: "video/mp4",
  vtt: "text/vtt",
  jpg: "image/jpeg",
};

export function hlsContentType(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return HLS_CONTENT_TYPES[extension] ?? "application/octet-stream";
}
