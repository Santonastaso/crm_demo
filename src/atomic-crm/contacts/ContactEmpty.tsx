import { CreateButton } from "@/components/admin";
import { EmptyState } from "../misc/EmptyState";
import { ContactImportButton } from "./ContactImportButton";

export const ContactEmpty = () => (
  <EmptyState
    title="No contacts found"
    message="It seems your contact list is empty."
    actions={
      <>
        <CreateButton label="New Contact" />
        <ContactImportButton />
      </>
    }
  />
);
