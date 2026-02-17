import { ResourceFormShell } from "../layout/ResourceFormShell";
import { CompanyAside } from "./CompanyAside";
import { CompanyInputs } from "./CompanyInputs";
import { companyTransform } from "./companyTransform";

export const CompanyEdit = () => (
  <ResourceFormShell
    mode="edit"
    redirect="show"
    aside={<CompanyAside link="show" />}
    formClassName="flex flex-1 flex-col gap-4 pb-2"
    transform={companyTransform}
  >
    <CompanyInputs />
  </ResourceFormShell>
);
