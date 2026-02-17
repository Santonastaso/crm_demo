import { ResourceFormShell } from "../layout/ResourceFormShell";
import { CampaignInputs } from "./CampaignInputs";

export const CampaignEdit = () => (
  <ResourceFormShell mode="edit" redirect="show" maxWidth="lg">
    <CampaignInputs />
  </ResourceFormShell>
);
