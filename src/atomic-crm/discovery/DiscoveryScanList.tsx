import {
  List,
  CreateButton,
  DataTable,
  ReferenceField,
  TextField,
} from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext, useNotify, useRefresh } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

const StatusBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
    pending: "outline",
    running: "secondary",
    completed: "default",
    failed: "destructive",
  };
  return (
    <Badge variant={variants[record.status] ?? "outline"}>
      {record.status}
    </Badge>
  );
};

const ProjectName = () => {
  const record = useRecordContext();
  if (!record?.project_id) return null;
  return (
    <ReferenceField source="project_id" reference="projects" link={false}>
      <TextField source="name" />
    </ReferenceField>
  );
};

const RunScanButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  if (!record || record.status === "completed" || record.status === "running") {
    return null;
  }

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("discovery-scan", {
        method: "POST",
        body: { scan_id: record.id },
      });
      if (error) throw error;
      notify("Scan started successfully");
      refresh();
    } catch {
      notify("Failed to start scan", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleRun} disabled={loading}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
      Run
    </Button>
  );
};

export const DiscoveryScanList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "created_at", order: "DESC" }}
    actions={
      <TopToolbar>
        <CreateButton label="New Scan" />
      </TopToolbar>
    }
  >
    <DataTable>
      <DataTable.Col source="project_id" label="Project">
        <ProjectName />
      </DataTable.Col>
      <DataTable.Col source="radius_km" label="Radius (km)" />
      <DataTable.Col source="status" label="Status">
        <StatusBadge />
      </DataTable.Col>
      <DataTable.Col source="created_at" label="Created" />
      <DataTable.Col source="id" label="Actions">
        <RunScanButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
