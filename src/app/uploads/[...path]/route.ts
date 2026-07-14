import { NextRequest, NextResponse } from "next/server";
import { join, resolve } from "path";
import { readFile } from "fs/promises";

const MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const filePath = join(UPLOADS_DIR, ...path);

  // Prevent directory traversal
  if (!resolve(filePath).startsWith(resolve(UPLOADS_DIR))) {
    return new NextResponse(null, { status: 400 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
