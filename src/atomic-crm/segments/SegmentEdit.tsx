import { ResourceFormShell } from "../layout/ResourceFormShell";
import { SegmentInputs } from "./SegmentInputs";
import { useSegmentRefreshOnSuccess } from "./useSegmentRefresh";

export const SegmentEdit = () => {
  const onSuccess = useSegmentRefreshOnSuccess("saved");
  return (
    <ResourceFormShell mode="edit" redirect={false} mutationOptions={{ onSuccess }}>
      <SegmentInputs />
    </ResourceFormShell>
  );
};
