import { createHmac } from "node:crypto";
import { env } from "@/shared/config/env";
import type { QrPayload } from "@/modules/qr/domain/qr-payload";

function sign(encodedPayload: string): string {
  return createHmac("sha256", env.QR_SECRET).update(encodedPayload).digest("base64url");
}

export function generateQrToken(payload: QrPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyQrToken(token: string): QrPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "studentId" in parsed &&
      "courseId" in parsed &&
      "teacherId" in parsed
    ) {
      return parsed as QrPayload;
    }
    return null;
  } catch {
    return null;
  }
}
