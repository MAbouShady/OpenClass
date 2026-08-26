import { createReadStream } from "node:fs";
import { cp, mkdir, open, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { env } from "@/shared/config/env";
import type {
  MediaStorage,
  StoredObjectRange,
  StoredObjectStat,
} from "@/modules/recordings/domain/media-storage";
import {
  isSafeStorageKey,
  uploadSessionKey,
  uploadSessionPrefix,
} from "@/modules/recordings/domain/storage-keys";

const UPLOAD_ID = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Disk-backed private media storage.
 *
 * The root lives outside `public/`, so Next.js never serves any of it
 * statically — every byte has to come through an authorized route handler.
 */
export class LocalMediaStorage implements MediaStorage {
  private readonly root: string;

  constructor(root: string = env.MEDIA_ROOT) {
    this.root = resolve(root);
  }

  /**
   * Keys are server-generated, but this still validates and re-checks the
   * resolved path against the root — defence in depth against traversal if a
   * key ever becomes influenced by user input.
   */
  private pathFor(key: string): string {
    if (!isSafeStorageKey(key)) {
      throw new Error("Invalid storage key.");
    }
    const full = resolve(join(this.root, key));
    if (full !== this.root && !full.startsWith(this.root + sep)) {
      throw new Error("Invalid storage key.");
    }
    return full;
  }

  private uploadPartPath(uploadId: string): string {
    if (!UPLOAD_ID.test(uploadId)) {
      throw new Error("Invalid upload id.");
    }
    return this.pathFor(uploadSessionKey(uploadId));
  }

  async createUpload(uploadId: string): Promise<void> {
    const partPath = this.uploadPartPath(uploadId);
    await mkdir(dirname(partPath), { recursive: true });
    await writeFile(partPath, new Uint8Array(0), { flag: "w" });
  }

  async appendChunk(uploadId: string, offset: number, chunk: Uint8Array): Promise<number> {
    const partPath = this.uploadPartPath(uploadId);
    const current = await stat(partPath);

    // Chunks must land exactly where the previous one ended. A client that
    // resumes simply re-reads `uploadedBytes` and continues from there.
    if (current.size !== offset) {
      throw new Error(`Chunk offset mismatch: expected ${current.size}, got ${offset}.`);
    }

    const handle = await open(partPath, "a");
    try {
      await handle.appendFile(chunk);
    } finally {
      await handle.close();
    }

    return current.size + chunk.byteLength;
  }

  async readUploadHead(uploadId: string, length: number): Promise<Uint8Array> {
    const partPath = this.uploadPartPath(uploadId);
    const handle = await open(partPath, "r");
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, 0);
      return new Uint8Array(buffer.subarray(0, bytesRead));
    } finally {
      await handle.close();
    }
  }

  async uploadedBytes(uploadId: string): Promise<number> {
    try {
      return (await stat(this.uploadPartPath(uploadId))).size;
    } catch {
      return 0;
    }
  }

  async finalizeUpload(uploadId: string, key: string): Promise<void> {
    const partPath = this.uploadPartPath(uploadId);
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    await rename(partPath, target);
    await rm(this.pathFor(uploadSessionPrefix(uploadId)), { recursive: true, force: true });
  }

  async abortUpload(uploadId: string): Promise<void> {
    if (!UPLOAD_ID.test(uploadId)) return;
    await rm(this.pathFor(uploadSessionPrefix(uploadId)), { recursive: true, force: true });
  }

  async stat(key: string): Promise<StoredObjectStat | null> {
    try {
      const result = await stat(this.pathFor(key));
      return result.isFile() ? { sizeBytes: result.size } : null;
    } catch {
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    return (await this.stat(key)) !== null;
  }

  async read(key: string, range?: StoredObjectRange): Promise<Uint8Array> {
    const path = this.pathFor(key);
    if (!range) {
      const handle = await open(path, "r");
      try {
        return new Uint8Array(await handle.readFile());
      } finally {
        await handle.close();
      }
    }

    const length = range.end - range.start + 1;
    const handle = await open(path, "r");
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, range.start);
      return new Uint8Array(buffer.subarray(0, bytesRead));
    } finally {
      await handle.close();
    }
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  async deletePrefix(prefix: string): Promise<void> {
    await rm(this.pathFor(prefix), { recursive: true, force: true });
  }

  /** Already local — hand back the real path and give the caller nothing to clean up. */
  async materialize(key: string): Promise<{ path: string; cleanup: () => Promise<void> }> {
    const path = this.pathFor(key);
    await stat(path);
    return { path, cleanup: async () => {} };
  }

  async putDirectory(localDir: string, prefix: string): Promise<void> {
    const target = this.pathFor(prefix);
    await mkdir(dirname(target), { recursive: true });
    await rm(target, { recursive: true, force: true });
    await cp(localDir, target, { recursive: true });
  }

  async putObject(key: string, data: Uint8Array): Promise<void> {
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
  }

  /**
   * Removes upload staging directories older than `maxAgeMs`. Interrupted
   * uploads would otherwise sit on disk forever. Returns how many were swept.
   */
  async sweepStaleUploads(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const uploadsRoot = join(this.root, "uploads");
    let entries: string[];
    try {
      entries = await readdir(uploadsRoot);
    } catch {
      return 0;
    }

    const cutoff = Date.now() - maxAgeMs;
    let swept = 0;

    for (const entry of entries) {
      if (!UPLOAD_ID.test(entry)) continue;
      const path = join(uploadsRoot, entry);
      try {
        const info = await stat(path);
        if (info.mtimeMs < cutoff) {
          await rm(path, { recursive: true, force: true });
          swept += 1;
        }
      } catch {
        // Another sweep or a concurrent finalize got there first.
      }
    }

    return swept;
  }

  /** Node stream for a stored object, used to stream segments without buffering. */
  createStream(key: string, range?: StoredObjectRange): NodeJS.ReadableStream {
    return createReadStream(this.pathFor(key), range ? { start: range.start, end: range.end } : {});
  }
}
