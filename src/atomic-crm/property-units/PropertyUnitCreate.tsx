import { ResourceFormShell } from "../layout/ResourceFormShell";
import { PropertyUnitInputs } from "./PropertyUnitInputs";

export const PropertyUnitCreate = () => (
  <ResourceFormShell mode="create" saveLabel="Create Unit">
    <PropertyUnitInputs />
  </ResourceFormShell>
);
