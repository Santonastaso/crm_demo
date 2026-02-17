import { useGetIdentity } from "ra-core";
import type { Contact } from "../types";
import { ResourceFormShell } from "../layout/ResourceFormShell";
import { ContactInputs } from "./ContactInputs";

export const ContactCreate = () => {
  const { identity } = useGetIdentity();
  return (
    <ResourceFormShell
      mode="create"
      redirect="show"
      maxWidth="none"
      defaultValues={{ sales_id: identity?.id }}
      transform={(data: Record<string, unknown>) => ({
        ...data,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        tags: [],
        source: data.source ?? "manual",
      } as Contact & Record<string, unknown>)}
    >
      <ContactInputs />
    </ResourceFormShell>
  );
};
