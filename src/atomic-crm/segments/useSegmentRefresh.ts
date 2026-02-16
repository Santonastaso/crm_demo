import { useCallback } from "react";
import { useNotify, useRedirect } from "ra-core";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

/**
 * Returns an onSuccess callback that refreshes segment membership
 * after create or update, then redirects to the list.
 */
export function useSegmentRefreshOnSuccess(verb: "created" | "saved") {
  const notify = useNotify();
  const redirect = useRedirect();

  return useCallback(
    async (data: { id: number }) => {
      try {
        const { data: result, error } = await supabase.functions.invoke(
          "segments-refresh",
          { method: "POST", body: { segment_id: data.id } },
        );
        if (error) throw error;
        notify(
          `Segment ${verb} and refreshed: ${result?.contact_count ?? 0} contacts matched`,
        );
      } catch {
        notify(`Segment ${verb} but refresh failed. Refresh manually.`, {
          type: "warning",
        });
      }
      redirect("list", "segments");
    },
    [notify, redirect, verb],
  );
}
