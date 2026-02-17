import { corsHeaders, createErrorResponse } from "./utils.ts";

/**
 * Returns a preflight/405 Response when the request method is not in `methods`.
 * Returns null if the request should be processed.
 */
export function requireMethod(req: Request, methods: string[]): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (!methods.includes(req.method)) {
    return createErrorResponse(405, "Method Not Allowed");
  }
  return null;
}

/**
 * Shorthand: only allow POST.
 */
export function requirePost(req: Request): Response | null {
  return requireMethod(req, ["POST"]);
}
