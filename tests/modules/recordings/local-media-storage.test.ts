// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalMediaStorage } from "@/modules/recordings/infrastructure/local-media-storage";

let root: string;
let storage: LocalMediaStorage;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "openclass-media-"));
  storage = new LocalMediaStorage(root);
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("LocalMediaStorage", () => {
  it("assembles a chunked upload and moves it to its permanent key", async () => {
    await storage.createUpload("upload-11111111");
    expect(await storage.appendChunk("upload-11111111", 0, new Uint8Array([1, 2, 3]))).toBe(3);
    expect(await storage.appendChunk("upload-11111111", 3, new Uint8Array([4, 5]))).toBe(5);
    expect(await storage.uploadedBytes("upload-11111111")).toBe(5);

    await storage.finalizeUpload("upload-11111111", "videos/asset-1/original.mp4");

    expect(await storage.stat("videos/asset-1/original.mp4")).toEqual({ sizeBytes: 5 });
    expect(Array.from(await storage.read("videos/asset-1/original.mp4"))).toEqual([1, 2, 3, 4, 5]);
    // The staging area is cleaned up once the upload is sealed.
    expect(await storage.uploadedBytes("upload-11111111")).toBe(0);
  });

  it("rejects a chunk that does not continue where the last one ended", async () => {
    await storage.createUpload("upload-22222222");
    await storage.appendChunk("upload-22222222", 0, new Uint8Array([1]));

    await expect(storage.appendChunk("upload-22222222", 99, new Uint8Array([2]))).rejects.toThrow(
      /offset mismatch/,
    );
  });

  it("serves byte ranges", async () => {
    await storage.putObject("videos/asset-2/hls/segment-001.ts", new Uint8Array([0, 1, 2, 3, 4]));

    const middle = await storage.read("videos/asset-2/hls/segment-001.ts", { start: 1, end: 3 });
    expect(Array.from(middle)).toEqual([1, 2, 3]);
  });

  it("refuses keys that try to climb out of the media root", async () => {
    // A secret sitting next to, but outside, the storage root.
    await writeFile(join(root, "..", "openclass-secret.txt"), "top secret");

    await expect(storage.read("../openclass-secret.txt")).rejects.toThrow("Invalid storage key");
    await expect(storage.read("videos/../../openclass-secret.txt")).rejects.toThrow(
      "Invalid storage key",
    );
    await expect(storage.stat("/etc/passwd")).resolves.toBeNull();

    await rm(join(root, "..", "openclass-secret.txt"), { force: true });
  });

  it("rejects a malformed upload id", async () => {
    await expect(storage.createUpload("../../etc")).rejects.toThrow("Invalid upload id");
  });

  it("reports a missing object rather than throwing", async () => {
    expect(await storage.stat("videos/nope/original.mp4")).toBeNull();
    expect(await storage.exists("videos/nope/original.mp4")).toBe(false);
  });

  it("removes an entire asset prefix", async () => {
    await storage.putObject("videos/asset-3/original.mp4", new Uint8Array([1]));
    await storage.putObject("videos/asset-3/hls/master.m3u8", new Uint8Array([2]));

    await storage.deletePrefix("videos/asset-3");

    expect(await storage.exists("videos/asset-3/original.mp4")).toBe(false);
    expect(await storage.exists("videos/asset-3/hls/master.m3u8")).toBe(false);
  });
});

describe("stale upload sweep", () => {
  it("removes abandoned upload staging directories", async () => {
    await storage.createUpload("upload-33333333");
    await storage.appendChunk("upload-33333333", 0, new Uint8Array([1, 2]));

    // Nothing is old enough yet.
    expect(await storage.sweepStaleUploads(24 * 60 * 60 * 1000)).toBe(0);
    expect(await storage.uploadedBytes("upload-33333333")).toBe(2);

    // With a zero-length window everything staged counts as abandoned.
    expect(await storage.sweepStaleUploads(-1)).toBeGreaterThan(0);
    expect(await storage.uploadedBytes("upload-33333333")).toBe(0);
  });
});
