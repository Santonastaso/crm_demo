import { base64UrlDecode } from "./encoding.ts";

/** @deprecated Use base64UrlDecode from encoding.ts directly */
export const decodeBase64Url = base64UrlDecode;

export function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

export function extractEmail(headerValue: string): string {
  const match = headerValue.match(/<([^>]+)>/);
  return (match ? match[1] : headerValue).toLowerCase().trim();
}

interface GmailPayload {
  body?: { data?: string; size?: number };
  parts?: Array<{ mimeType: string; body?: { data?: string; size?: number } }>;
}

export function getBodyText(payload: GmailPayload): string {
  if (payload.body?.data) return decodeBase64Url(payload.body.data);

  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBase64Url(textPart.body.data);
  }

  return "";
}
