import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file || !type) {
    return NextResponse.json({ error: "Missing file or type." }, { status: 400 });
  }

  if (!["photo", "cover", "payment"].includes(type)) {
    return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP or GIF allowed." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)." }, { status: 400 });
  }

  const ext = file.type.split("/")[1] ?? "jpg";

  let dir: string;
  let url: string;

  if (type === "payment") {
    const ts = Date.now();
    const filename = `${ts}.${ext}`;
    dir = join(process.cwd(), "public", "uploads", "payments", session.user.id);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    url = `/uploads/payments/${session.user.id}/${filename}`;
  } else {
    const filename = `${type}.${ext}`;
    dir = join(process.cwd(), "public", "uploads", "teachers", session.user.id);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    url = `/uploads/teachers/${session.user.id}/${filename}`;
  }

  return NextResponse.json({ url });
}
