import { supabaseAdmin } from "./supabaseAdmin.ts";
import { createErrorResponse } from "./utils.ts";

/**
 * Fetches a single entity by ID from the given table.
 * Returns `{ data }` on success, or `{ response }` with a 404 error.
 */
export async function fetchEntityOr404<T = Record<string, unknown>>(
  table: string,
  id: number,
  label: string,
): Promise<{ data: T; response?: never } | { data?: never; response: Response }> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (!data || error) {
    return { response: createErrorResponse(404, `${label} not found`) };
  }

  return { data: data as T };
}
