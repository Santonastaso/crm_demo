import { List, CreateButton, DataTable } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { StatusBadge, type StatusMap } from "@/atomic-crm/misc/StatusBadge";

const knowledgeStatusMap: StatusMap = {
  processed: "default",
  error: "destructive",
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
        <StatusBadge source="status" map={knowledgeStatusMap} fallbackVariant="secondary" />
      </DataTable.Col>
      <DataTable.Col source="created_at" label="Uploaded" />
    </DataTable>
  </List>
);
