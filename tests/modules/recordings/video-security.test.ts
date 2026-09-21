// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  generatePlaybackToken,
  verifyPlaybackToken,
  verifyStreamAccess,
} from "@/modules/recordings/domain/playback-token";
import { appendTokenToPlaylist, isPlaylistPath } from "@/modules/recordings/domain/hls-playlist";
import { isSafeStorageKey, sanitizeFilename } from "@/modules/recordings/domain/storage-keys";
import {
  sniffVideoContainer,
  validateVideoUploadRequest,
} from "@/modules/recordings/domain/video-file-type";

const PAYLOAD = { a: "asset-1", v: "video-1", u: "student-1" };

describe("playback tokens", () => {
  it("round-trips a payload", () => {
    const { token } = generatePlaybackToken(PAYLOAD, 300);
    expect(verifyPlaybackToken(token)).toMatchObject(PAYLOAD);
  });

  it("rejects a tampered signature", () => {
    const { token } = generatePlaybackToken(PAYLOAD, 300);
    const [encoded] = token.split(".");
    expect(verifyPlaybackToken(`${encoded}.deadbeef`)).toBeNull();
  });

  it("rejects a re-signed payload for another asset", () => {
    const { token } = generatePlaybackToken(PAYLOAD, 300);
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...PAYLOAD, a: "asset-999", e: 9_999_999_999 }),
      "utf8",
    ).toString("base64url");
    expect(verifyPlaybackToken(`${forged}.${signature}`)).toBeNull();
  });

  it("rejects an expired token, and keeps rejecting it on reuse", () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    const { token } = generatePlaybackToken(PAYLOAD, 60, issuedAt);

    const justBefore = new Date(issuedAt.getTime() + 59_000);
    expect(verifyPlaybackToken(token, justBefore)).not.toBeNull();

    const afterExpiry = new Date(issuedAt.getTime() + 61_000);
    expect(verifyPlaybackToken(token, afterExpiry)).toBeNull();
    expect(verifyPlaybackToken(token, new Date(issuedAt.getTime() + 600_000))).toBeNull();
  });

  it("refuses a valid token pointed at a different asset", () => {
    const { token } = generatePlaybackToken(PAYLOAD, 300);

    expect(verifyStreamAccess(token, "asset-1")).not.toBeNull();
    expect(verifyStreamAccess(token, "asset-2")).toBeNull();
  });

  it("rejects garbage", () => {
    expect(verifyPlaybackToken("")).toBeNull();
    expect(verifyPlaybackToken("nonsense")).toBeNull();
    expect(verifyPlaybackToken("a.b.c")).toBeNull();
  });
});

describe("HLS playlist protection", () => {
  it("carries the token onto every variant and segment", () => {
    const master = [
      "#EXTM3U",
      "#EXT-X-STREAM-INF:BANDWIDTH=800000",
      "v0/playlist.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=2800000",
      "v1/playlist.m3u8",
      "",
    ].join("\n");

    const rewritten = appendTokenToPlaylist(master, "tok en/+=");

    expect(rewritten).toContain("v0/playlist.m3u8?t=tok%20en%2F%2B%3D");
    expect(rewritten).toContain("v1/playlist.m3u8?t=tok%20en%2F%2B%3D");
  });

  it("protects segments, keys and init sections", () => {
    const variant = [
      "#EXTM3U",
      '#EXT-X-MAP:URI="init.mp4"',
      '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"',
      "#EXTINF:6.0,",
      "segment-001.ts",
      "#EXTINF:6.0,",
      "segment-002.ts",
    ].join("\n");

    const rewritten = appendTokenToPlaylist(variant, "abc");

    expect(rewritten).toContain('URI="init.mp4?t=abc"');
    expect(rewritten).toContain('URI="key.bin?t=abc"');
    expect(rewritten).toContain("segment-001.ts?t=abc");
    expect(rewritten).toContain("segment-002.ts?t=abc");
    // Comment/tag lines must survive untouched.
    expect(rewritten).toContain("#EXTINF:6.0,");
  });

  it("leaves absolute URLs alone", () => {
    const playlist = "#EXTM3U\nhttps://cdn.example.com/segment.ts";
    expect(appendTokenToPlaylist(playlist, "abc")).toContain("https://cdn.example.com/segment.ts");
    expect(appendTokenToPlaylist(playlist, "abc")).not.toContain("segment.ts?t=");
  });

  it("recognises playlists by extension", () => {
    expect(isPlaylistPath("v0/playlist.m3u8")).toBe(true);
    expect(isPlaylistPath("v0/segment-001.ts")).toBe(false);
  });
});

describe("storage keys", () => {
  it("rejects traversal and absolute paths", () => {
    expect(isSafeStorageKey("videos/asset-1/hls/master.m3u8")).toBe(true);
    expect(isSafeStorageKey("videos/asset-1/../../../etc/passwd")).toBe(false);
    expect(isSafeStorageKey("/etc/passwd")).toBe(false);
    expect(isSafeStorageKey("videos\\asset-1")).toBe(false);
    expect(isSafeStorageKey("videos/asset-1/\0")).toBe(false);
    expect(isSafeStorageKey("")).toBe(false);
  });

  it("strips directories and unsafe characters from a filename", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("my lesson;rm -rf.mp4")).toBe("my_lesson_rm_-rf.mp4");
    expect(sanitizeFilename(".htaccess")).toBe("htaccess");
  });
});

describe("upload validation", () => {
  const base = { filename: "lesson.mp4", declaredMimeType: "video/mp4", maxBytes: 1_000_000 };

  it("accepts a well-formed request", () => {
    expect(validateVideoUploadRequest({ ...base, sizeBytes: 500 })).toEqual({
      mimeType: "video/mp4",
      extension: "mp4",
    });
  });

  it("rejects an oversized file", () => {
    const result = validateVideoUploadRequest({ ...base, sizeBytes: 2_000_000 });
    expect(result).toBeInstanceOf(Error);
  });

  it("rejects an empty file", () => {
    expect(validateVideoUploadRequest({ ...base, sizeBytes: 0 })).toBeInstanceOf(Error);
  });

  it("rejects an executable extension even with a video MIME type", () => {
    const result = validateVideoUploadRequest({
      ...base,
      filename: "payload.php",
      sizeBytes: 500,
    });
    expect(result).toBeInstanceOf(Error);
  });

  it("rejects a non-video MIME type", () => {
    const result = validateVideoUploadRequest({
      ...base,
      declaredMimeType: "application/x-php",
      sizeBytes: 500,
    });
    expect(result).toBeInstanceOf(Error);
  });

  it("accepts a file whose MIME type the operating system could not name", () => {
    // Windows reports "" for .mkv and .mov when nothing has claimed the
    // extension. The bytes are still sniffed at completion, so this is safe.
    expect(
      validateVideoUploadRequest({
        ...base,
        filename: "lesson.mkv",
        declaredMimeType: "",
        sizeBytes: 500,
      }),
    ).toEqual({ mimeType: "video/x-matroska", extension: "mkv" });

    expect(
      validateVideoUploadRequest({
        ...base,
        filename: "lesson.mov",
        declaredMimeType: "application/octet-stream",
        sizeBytes: 500,
      }),
    ).toEqual({ mimeType: "video/quicktime", extension: "mov" });
  });

  it("takes the extension over a browser MIME type that disagrees with it", () => {
    expect(
      validateVideoUploadRequest({
        ...base,
        filename: "lesson.webm",
        declaredMimeType: "video/mp4",
        sizeBytes: 500,
      }),
    ).toEqual({ mimeType: "video/webm", extension: "webm" });
  });

  it("sniffs the real container from the bytes", () => {
    const mp4 = new Uint8Array([
      0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0,
    ]);
    expect(sniffVideoContainer(mp4)).toEqual({ mimeType: "video/mp4", extension: "mp4" });

    const mov = new Uint8Array([
      0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20, 0, 0, 0, 0,
    ]);
    expect(sniffVideoContainer(mov)).toEqual({ mimeType: "video/quicktime", extension: "mov" });

    const webm = ebmlWithDocType("webm");
    expect(sniffVideoContainer(webm)).toEqual({ mimeType: "video/webm", extension: "webm" });

    const mkv = ebmlWithDocType("matroska");
    expect(sniffVideoContainer(mkv)).toEqual({ mimeType: "video/x-matroska", extension: "mkv" });

    // No readable DocType: still EBML, so it is treated as the safer WebM.
    const bare = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
    expect(sniffVideoContainer(bare)).toEqual({ mimeType: "video/webm", extension: "webm" });
  });

  it("recognises a wrong file from the opening bytes alone", () => {
    // What the upload now checks before sending anything, and again on the
    // first chunk it receives: the head of a real file, not the whole thing.
    const pdf = new TextEncoder().encode("%PDF-1.7\n%\xe2\xe3\xcf\xd3\n1 0 obj");
    expect(sniffVideoContainer(pdf.subarray(0, 64))).toBeNull();

    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0, 0, 0, 8, 0, 0, 0, 0, 0]);
    expect(sniffVideoContainer(zip.subarray(0, 64))).toBeNull();

    // A truncated download: the right extension, no container header yet.
    expect(sniffVideoContainer(new Uint8Array(12))).toBeNull();
  });

  it("recognises a good file from the opening bytes alone", () => {
    const mp4 = new Uint8Array(64);
    mp4.set([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], 0);
    expect(sniffVideoContainer(mp4.subarray(0, 64))).toEqual({
      mimeType: "video/mp4",
      extension: "mp4",
    });
  });

  it("refuses bytes that are not a video, however the file was named", () => {
    // "<?php system($_GET[0]); ?>" renamed to lesson.mp4 with a video MIME type.
    const php = new TextEncoder().encode("<?php system($_GET[0]); ?>");
    expect(sniffVideoContainer(php)).toBeNull();

    const elf = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0, 0, 0, 0]);
    expect(sniffVideoContainer(elf)).toBeNull();

    expect(sniffVideoContainer(new Uint8Array(0))).toBeNull();
  });
});

/** An EBML header carrying the given DocType, the way a real file lays it out. */
function ebmlWithDocType(docType: string): Uint8Array {
  const name = new TextEncoder().encode(docType);
  return new Uint8Array([
    0x1a,
    0x45,
    0xdf,
    0xa3,
    0x01,
    0x00,
    0x00,
    0x00,
    0x42,
    0x82,
    0x80 | name.length,
    ...name,
  ]);
}
