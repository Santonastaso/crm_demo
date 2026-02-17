import { CreateButton } from "@/components/admin";
import { EmptyState } from "../misc/EmptyState";

export const CompanyEmpty = () => (
  <EmptyState
    title="No companies found"
    message="It seems your company list is empty."
    actions={<CreateButton label="Create Company" />}
  />
);
