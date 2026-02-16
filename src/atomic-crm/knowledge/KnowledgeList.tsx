import { List, CreateButton, DataTable } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";

const StatusBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  const variant =
    record.status === "processed"
      ? "default"
      : record.status === "error"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{record.status}</Badge>;
};

export const KnowledgeList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "created_at", order: "DESC" }}
    actions={
      <TopToolbar>
        <CreateButton label="Upload Document" />
      </TopToolbar>
    }
  >
    <DataTable rowClick="show">
      <DataTable.Col source="title" label="Title" />
      <DataTable.Col source="file_type" label="Type" />
      <DataTable.Col source="status" label="Status">
        <StatusBadge />
      </DataTable.Col>
      <DataTable.Col source="created_at" label="Uploaded" />
    </DataTable>
  </List>
);
