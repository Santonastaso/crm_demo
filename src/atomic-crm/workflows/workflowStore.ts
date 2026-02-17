import { supabase } from "../providers/supabase/supabase";
import type { Workflow } from "./types";

/**
 * Fetch all enabled workflows directly from Supabase.
 * Used by the workflow engine inside the data provider's afterUpdate hook
 * where React hooks are not available.
 */
export async function fetchEnabledWorkflows(): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("enabled", true);

  if (error || !data) {
    console.error("Failed to fetch workflows:", error);
    return [];
  }

  return data.map((row) => ({
    ...row,
    trigger: row.trigger as Workflow["trigger"],
    action: row.action as Workflow["action"],
  }));
}
