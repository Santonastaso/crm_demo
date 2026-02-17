import { List, CreateButton, DataTable } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext, useNotify } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useInvokeFunction } from "@/atomic-crm/hooks/useInvokeFunction";

const AutoRefreshBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Badge variant={record.auto_refresh ? "default" : "outline"}>
      {record.auto_refresh ? "Auto" : "Manual"}
    </Badge>
  );
};

const CriteriaCount = () => {
  const record = useRecordContext();
  if (!record) return null;
  const criteria = record.criteria ?? [];
  return <span>{criteria.length} rule{criteria.length !== 1 ? "s" : ""}</span>;
};

const RefreshButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const { invoke, loading } = useInvokeFunction();

  if (!record) return null;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const data = await invoke<{ contact_count?: number }>(
      "segments-refresh",
      { segment_id: record.id },
      { errorMessage: "Failed to refresh segment" },
    );
    if (data !== null) {
      notify(`Segment refreshed: ${data?.contact_count ?? 0} contacts matched`);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleRefresh} disabled={loading}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
      Refresh
    </Button>
  );
};

export const SegmentList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "name", order: "ASC" }}
    actions={
      <TopToolbar>
        <CreateButton label="New Segment" />
      </TopToolbar>
    }
  >
    <DataTable rowClick="show">
      <DataTable.Col source="name" label="Name" />
      <DataTable.Col source="criteria" label="Rules">
        <CriteriaCount />
      </DataTable.Col>
      <DataTable.Col source="auto_refresh" label="Refresh Mode">
        <AutoRefreshBadge />
      </DataTable.Col>
      <DataTable.Col source="last_refreshed_at" label="Last Refreshed" />
      <DataTable.Col source="id" label="Actions">
        <RefreshButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
