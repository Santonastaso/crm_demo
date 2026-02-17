import { utf8ToBase64 } from "./encoding.ts";

/** Inject open-tracking pixel and click-tracking redirect into HTML */
export function injectTracking(html: string, trackingId: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const trackBase = `${supabaseUrl}/functions/v1/email-track`;

  const pixel = `<img src="${trackBase}?t=${trackingId}&type=open" width="1" height="1" style="display:none" alt="" />`;

  const withLinks = html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, url) => {
      const encoded = encodeURIComponent(url);
      return `href="${trackBase}?t=${trackingId}&type=click&url=${encoded}"`;
    },
  );

  return withLinks + pixel;
}

/** Build a MIME multipart/alternative raw email string */
export function buildRawEmail(
  from: string,
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText?: string,
): string {
  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "");
  const plainText = bodyText ?? bodyHtml.replace(/<[^>]*>/g, "");

  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    utf8ToBase64(plainText),
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    utf8ToBase64(bodyHtml),
    "",
    `--${boundary}--`,
  ];

  return lines.join("\r\n");
}
