import { useGetIdentity } from "ra-core";
import { ResourceFormShell } from "../layout/ResourceFormShell";
import { TemplateInputs } from "./TemplateInputs";

export const TemplateCreate = () => {
  const { identity } = useGetIdentity();
  return (
    <ResourceFormShell mode="create" maxWidth="lg" saveLabel="Create Template" defaultValues={{ sales_id: identity?.id, variables: [] }}>
      <TemplateInputs />
    </ResourceFormShell>
  );
};
