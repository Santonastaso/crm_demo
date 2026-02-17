import { ResourceFormShell } from "../layout/ResourceFormShell";
import { ContactAside } from "./ContactAside";
import { ContactInputs } from "./ContactInputs";

export const ContactEdit = () => (
  <ResourceFormShell
    mode="edit"
    redirect="show"
    aside={<ContactAside link="show" />}
    formClassName="flex flex-1 flex-col gap-4"
  >
    <ContactInputs />
  </ResourceFormShell>
);
