import { useGetIdentity } from "ra-core";
import { ResourceFormShell } from "../layout/ResourceFormShell";
import { CampaignInputs } from "./CampaignInputs";

export const CampaignCreate = () => {
  const { identity } = useGetIdentity();
  return (
    <ResourceFormShell
      mode="create"
      redirect="show"
      maxWidth="lg"
      saveLabel="Create Campaign"
      defaultValues={{ sales_id: identity?.id, status: "draft", channel: "email" }}
    >
      <CampaignInputs />
    </ResourceFormShell>
  );
};
