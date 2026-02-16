import { CreateBase, Form, useGetIdentity, useNotify, useRedirect } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";
import { SegmentInputs } from "./SegmentInputs";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import { useCallback } from "react";

export const SegmentCreate = () => {
  const { identity } = useGetIdentity();
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
          `Segment created and refreshed: ${result?.contact_count ?? 0} contacts matched`,
        );
      } catch {
        notify("Segment created but auto-refresh failed. Refresh manually.", {
          type: "warning",
        });
      }
      redirect("list", "segments");
    },
    [notify, redirect],
  );

  return (
    <CreateBase redirect={false} mutationOptions={{ onSuccess }}>
      <div className="mt-2 max-w-2xl mx-auto">
        <Form
          defaultValues={{
            sales_id: identity?.id,
            criteria: [],
            auto_refresh: false,
          }}
        >
          <Card>
            <CardContent>
              <SegmentInputs />
              <FormToolbar>
                <div className="flex flex-row gap-2 justify-end">
                  <CancelButton />
                  <SaveButton label="Create Segment" />
                </div>
              </FormToolbar>
            </CardContent>
          </Card>
        </Form>
      </div>
    </CreateBase>
  );
};
