import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { SegmentInputs } from "./SegmentInputs";
import { useSegmentRefreshOnSuccess } from "./useSegmentRefresh";

export const SegmentEdit = () => {
  const onSuccess = useSegmentRefreshOnSuccess("saved");

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
