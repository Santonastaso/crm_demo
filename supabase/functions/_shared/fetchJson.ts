/**
 * Typed fetch wrapper that handles JSON parsing and error detection.
 * Replaces the repeated `fetch + res.json() + !res.ok` pattern.
 */
export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T; status: number } | { ok: false; data: unknown; status: number }> {
  const res = await fetch(url, init);
  const data = await res.json();
  return { ok: res.ok, data, status: res.status } as
    | { ok: true; data: T; status: number }
    | { ok: false; data: unknown; status: number };
}
