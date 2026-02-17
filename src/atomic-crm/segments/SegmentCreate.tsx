import { useGetIdentity } from "ra-core";
import { ResourceFormShell } from "../layout/ResourceFormShell";
import { SegmentInputs } from "./SegmentInputs";
import { useSegmentRefreshOnSuccess } from "./useSegmentRefresh";

export const SegmentCreate = () => {
  const { identity } = useGetIdentity();
  const onSuccess = useSegmentRefreshOnSuccess("created");
  return (
    <ResourceFormShell
      mode="create"
      redirect={false}
      saveLabel="Create Segment"
      defaultValues={{ sales_id: identity?.id, criteria: [], auto_refresh: false }}
      mutationOptions={{ onSuccess }}
    >
      <SegmentInputs />
    </ResourceFormShell>
  );
};
