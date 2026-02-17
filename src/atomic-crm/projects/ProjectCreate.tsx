import { ResourceFormShell } from "../layout/ResourceFormShell";
import { ProjectInputs } from "./ProjectInputs";

export const ProjectCreate = () => (
  <ResourceFormShell mode="create" maxWidth="lg" saveLabel="Create Project">
    <ProjectInputs />
  </ResourceFormShell>
);
