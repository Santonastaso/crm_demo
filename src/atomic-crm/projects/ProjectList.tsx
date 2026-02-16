import { List, CreateButton, DataTable } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";

const StatusBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Badge variant={record.status === "active" ? "default" : "secondary"}>
      {record.status}
    </Badge>
  );
};

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
        <StatusBadge />
      </DataTable.Col>
    </DataTable>
  </List>
);
