import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/shared/config/env";
import { verifyStreamAccess } from "@/modules/recordings/domain/playback-token";
import {
  appendTokenToPlaylist,
  hlsContentType,
  isPlaylistPath,
} from "@/modules/recordings/domain/hls-playlist";
import {
  hlsPrefixKey,
  isSafeStorageKey,
  thumbnailKey,
} from "@/modules/recordings/domain/storage-keys";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveViewerId } from "@/modules/recordings/infrastructure/recording-actor";
import { internalError } from "@/modules/recordings/infrastructure/api-response";

/**
 * The private HLS origin.
 *
 * Every playlist *and* every segment comes through here, and every one of them
 * requires a signed session plus an unexpired token minted for this exact asset
 * and this exact viewer. Playlists are rewritten on the way out so the player
 * carries the same token to each segment — securing the manifest while leaving
 * `.ts` files open is the mistake this endpoint exists to avoid.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string; path: string[] }> },
) {
  const { assetId, path } = await params;

  const token = request.nextUrl.searchParams.get("t");
  if (!token) return deny();

  const payload = verifyStreamAccess(token, assetId);
  if (!payload) return deny();

  // The token alone would be enough, but binding it to the live session means a
  // copied URL is useless to anyone but the viewer it was minted for, even
  // inside its short lifetime. Accepts either a staff session or a code-number
  // portal session, and reads cookies only — no database round trip here.
  const viewerId = await resolveViewerId();
  if (!viewerId || viewerId !== payload.u) return deny();

  const relativePath = path.join("/");
  const key =
    relativePath === "thumbnail.jpg"
      ? thumbnailKey(assetId)
      : `${hlsPrefixKey(assetId)}/${relativePath}`;

  // Belt and braces: the key is built from an id we just authorized, and is
  // re-validated so no `..` segment can climb out of the asset's prefix.
  if (!isSafeStorageKey(key)) return deny();

  try {
    const stat = await recordings.mediaStorage.stat(key);
    if (!stat) return new NextResponse(null, { status: 404 });

    if (isPlaylistPath(relativePath)) {
      const raw = Buffer.from(await recordings.mediaStorage.read(key)).toString("utf8");
      return new NextResponse(appendTokenToPlaylist(raw, token), {
        headers: {
          "Content-Type": hlsContentType(relativePath),
          // Playlists are per-viewer once rewritten — never let a shared cache hold one.
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const range = parseRange(request.headers.get("range"), stat.sizeBytes);
    const body = await recordings.mediaStorage.read(key, range ?? undefined);

    const headers = new Headers({
      "Content-Type": hlsContentType(relativePath),
      "Content-Length": String(body.byteLength),
      "Accept-Ranges": "bytes",
      // Segments are immutable, but the authorization in the URL is not, so the
      // cache window never outlives the token.
      "Cache-Control": `private, max-age=${env.PLAYBACK_TOKEN_TTL_SECONDS}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    });

    if (range) {
      headers.set("Content-Range", `bytes ${range.start}-${range.end}/${stat.sizeBytes}`);
      return new NextResponse(toBody(body), { status: 206, headers });
    }

    return new NextResponse(toBody(body), { status: 200, headers });
  } catch (error) {
    return internalError(`streaming ${key} failed`, error);
  }
}

/**
 * A single opaque refusal for missing, unauthorized and expired alike, so the
 * endpoint cannot be used to enumerate which asset ids exist.
 */
/** Narrows the byte view to a standalone ArrayBuffer the Response API accepts. */
function toBody(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function deny(): NextResponse {
  return NextResponse.json(
    { error: "This playback link is invalid or has expired." },
    { status: 403, headers: { "Cache-Control": "private, no-store" } },
  );
}

function parseRange(
  header: string | null,
  sizeBytes: number,
): { start: number; end: number } | null {
  if (!header) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  let start = rawStart ? Number(rawStart) : 0;
  let end = rawEnd ? Number(rawEnd) : sizeBytes - 1;

  if (!rawStart && rawEnd) {
    // Suffix range: the last N bytes.
    start = Math.max(0, sizeBytes - Number(rawEnd));
    end = sizeBytes - 1;
  }

  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  end = Math.min(end, sizeBytes - 1);
  if (start > end || start < 0) return null;

  return { start, end };
}
