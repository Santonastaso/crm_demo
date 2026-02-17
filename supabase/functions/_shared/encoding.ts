/** Encode a UTF-8 string to base64 */
export function utf8ToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/** Encode a raw string to URL-safe base64 (no padding) */
export function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode URL-safe base64 to a string */
export function base64UrlDecode(data: string): string {
  try {
    return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return "";
  }
}
