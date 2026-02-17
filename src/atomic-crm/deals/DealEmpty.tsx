import { CreateButton } from "@/components/admin";
import { Progress } from "@/components/ui/progress";
import { useGetList } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { Link } from "react-router";
import { EmptyState } from "../misc/EmptyState";
import type { Contact } from "../types";
import { DealCreate } from "./DealCreate";

export const DealEmpty = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const matchCreate = matchPath("/deals/create", location.pathname);

  const { data: contacts, isPending: contactsLoading } = useGetList<Contact>(
    "contacts",
    { pagination: { page: 1, perPage: 1 } },
  );

  if (contactsLoading) return <Progress value={50} />;

  if (!contacts || contacts.length === 0) {
    return (
      <EmptyState
        title="No deals found"
        message="It seems your contact list is empty."
        actions={
          <Link to="/contacts/create" className="hover:underline">
            Add your first contact
          </Link>
        }
      />
    );
  }

  return (
    <>
      <EmptyState
        title="No deals found"
        message="It seems your deal list is empty."
        actions={<CreateButton label="Create deal" />}
      />
      <DealCreate open={!!matchCreate} />
      {children}
    </>
  );
};
