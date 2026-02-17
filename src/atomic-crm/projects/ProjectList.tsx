import { List, CreateButton, DataTable } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { StatusBadge } from "../misc/StatusBadge";

export const ProjectList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "name", order: "ASC" }}
    actions={
      <TopToolbar>
        <CreateButton label="New Project" />
      </TopToolbar>
    }
  >
    <DataTable>
      <DataTable.Col source="name" label="Name" />
      <DataTable.Col source="slug" label="Slug" />
      <DataTable.Col source="location" label="Location" />
      <DataTable.Col source="status" label="Status">
        <StatusBadge source="status" map={{ active: "default" }} fallbackVariant="secondary" />
      </DataTable.Col>
    </DataTable>
  </List>
);
