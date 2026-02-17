import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "./supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "./utils.ts";

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const localClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data } = await localClient.auth.getUser();
  return data?.user ?? null;
}

export async function getAuthenticatedSale(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return { user: null, sale: null };

  const { data: sale } = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { user, sale };
}

export function requireAuth(sale: unknown): Response | null {
  if (!sale) return createErrorResponse(401, "Unauthorized");
  return null;
}
