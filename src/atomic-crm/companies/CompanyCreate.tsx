import { useGetIdentity } from "ra-core";
import { ResourceFormShell } from "../layout/ResourceFormShell";
import { CompanyInputs } from "./CompanyInputs";
import { companyTransform } from "./companyTransform";

export const CompanyCreate = () => {
  const { identity } = useGetIdentity();
  return (
    <ResourceFormShell
      mode="create"
      redirect="show"
      maxWidth="none"
      saveLabel="Create Company"
      defaultValues={{ sales_id: identity?.id }}
      transform={companyTransform}
    >
      <CompanyInputs />
    </ResourceFormShell>
  );
};
