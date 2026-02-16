import { corsHeaders, createErrorResponse } from "./utils.ts";

/**
 * Returns a preflight/405 Response when the request is OPTIONS or not POST.
 * Returns null if the request is POST and should be processed.
 */
export function requirePost(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }
  return null;
}
