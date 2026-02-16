import { List, CreateButton, DataTable } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext, useNotify, useRefresh } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

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
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  if (!record) return null;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("segments-refresh", {
        method: "POST",
        body: { segment_id: record.id },
      });
      if (error) throw error;
      notify(`Segment refreshed: ${data?.contact_count ?? 0} contacts matched`);
      refresh();
    } catch {
      notify("Failed to refresh segment", { type: "error" });
    } finally {
      setLoading(false);
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
