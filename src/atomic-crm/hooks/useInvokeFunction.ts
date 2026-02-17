import { useCallback, useState } from "react";
import { useNotify, useRefresh } from "ra-core";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

interface InvokeOptions {
  successMessage?: string;
  errorMessage?: string;
  autoRefresh?: boolean;
}

export function useInvokeFunction() {
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  const invoke = useCallback(
    async <T = unknown>(
      fnName: string,
      body: Record<string, unknown>,
      options?: InvokeOptions,
    ): Promise<T | null> => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(fnName, {
          method: "POST",
          body,
        });
        if (error) throw error;
        if (options?.successMessage) {
          notify(options.successMessage);
        }
        if (options?.autoRefresh !== false) {
          refresh();
        }
        return data as T;
      } catch {
        notify(options?.errorMessage ?? "Operation failed", { type: "error" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [notify, refresh],
  );

  return { invoke, loading };
}
