import { useMemo } from "react";
import { useGetIdentity } from "ra-core";
import { ResourceFormShell } from "../layout/ResourceFormShell";
import { SegmentInputs } from "./SegmentInputs";
import { useSegmentRefreshOnSuccess } from "./useSegmentRefresh";
import { stripCriteriaIds } from "./segmentTransform";

export const SegmentCreate = () => {
  const { identity } = useGetIdentity();
  const onSuccess = useSegmentRefreshOnSuccess("created");
  const defaultValues = useMemo(
    () => ({ sales_id: identity?.id, criteria: [], auto_refresh: false }),
    [identity?.id],
  );
  return (
    <ResourceFormShell
      mode="create"
      redirect={false}
      saveLabel="Create Segment"
      defaultValues={defaultValues}
      mutationOptions={{ onSuccess }}
      transform={stripCriteriaIds}
    >
      <SegmentInputs />
    </ResourceFormShell>
  );
};
