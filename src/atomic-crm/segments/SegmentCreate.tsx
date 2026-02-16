import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";
import { SegmentInputs } from "./SegmentInputs";
import { useSegmentRefreshOnSuccess } from "./useSegmentRefresh";

export const SegmentCreate = () => {
  const { identity } = useGetIdentity();
  const onSuccess = useSegmentRefreshOnSuccess("created");

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
