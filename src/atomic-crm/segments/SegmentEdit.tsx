import { EditBase, Form, useNotify, useRedirect } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { SegmentInputs } from "./SegmentInputs";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import { useCallback } from "react";

export const SegmentEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const onSuccess = useCallback(
    async (data: { id: number }) => {
      try {
        const { data: result, error } = await supabase.functions.invoke(
          "segments-refresh",
          { method: "POST", body: { segment_id: data.id } },
        );
        if (error) throw error;
        notify(
          `Segment saved and refreshed: ${result?.contact_count ?? 0} contacts matched`,
        );
      } catch {
        notify("Segment saved but refresh failed. Refresh manually.", {
          type: "warning",
        });
      }
      redirect("list", "segments");
    },
    [notify, redirect],
  );

  return (
    <EditBase redirect={false} mutationOptions={{ onSuccess }}>
      <div className="mt-2 max-w-2xl mx-auto">
        <Form>
          <Card>
            <CardContent>
              <SegmentInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </div>
    </EditBase>
  );
};
