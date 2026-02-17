import { ResourceFormShell } from "../layout/ResourceFormShell";
import { TemplateInputs } from "./TemplateInputs";

export const TemplateEdit = () => (
  <ResourceFormShell mode="edit" maxWidth="lg">
    <TemplateInputs />
  </ResourceFormShell>
);
