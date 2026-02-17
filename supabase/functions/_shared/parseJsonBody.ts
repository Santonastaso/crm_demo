import { createErrorResponse } from "./utils.ts";

/**
 * Safely parse JSON from a request body.
 * Returns { ok: true, data } on success, { ok: false, response } on invalid JSON.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  req: Request,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  try {
    const data = await req.json() as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: createErrorResponse(400, "Invalid JSON body") };
  }
}
