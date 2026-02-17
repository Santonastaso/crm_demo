import { ResourceFormShell } from "../layout/ResourceFormShell";
import { ProjectInputs } from "./ProjectInputs";

export const ProjectEdit = () => (
  <ResourceFormShell mode="edit" maxWidth="lg">
    <ProjectInputs />
  </ResourceFormShell>
);
