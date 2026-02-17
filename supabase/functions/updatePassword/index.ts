import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { handleOptions, getAuthenticatedUser } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  const optRes = handleOptions(req);
  if (optRes) return optRes;

  const user = await getAuthenticatedUser(req);
  if (!user) return createErrorResponse(401, "Unauthorized");

  if (req.method !== "PATCH") return createErrorResponse(405, "Method Not Allowed");

  const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email!);
  if (!data || error) return createErrorResponse(500, "Internal Server Error");

  return createJsonResponse({ data });
});
