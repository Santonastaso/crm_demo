import {
  List,
  CreateButton,
  DataTable,
  ReferenceField,
  TextField,
} from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useInvokeFunction } from "@/atomic-crm/hooks/useInvokeFunction";
import { StatusBadge, type StatusMap } from "@/atomic-crm/misc/StatusBadge";

const scanStatusMap: StatusMap = {
  pending: "outline",
  running: "secondary",
  completed: "default",
  failed: "destructive",
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
  const { invoke, loading } = useInvokeFunction();

  if (!record || record.status === "completed" || record.status === "running") {
    return null;
  }

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await invoke("discovery-scan", { scan_id: record.id }, {
      successMessage: "Scan started successfully",
      errorMessage: "Failed to start scan",
    });
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
        <StatusBadge source="status" map={scanStatusMap} />
      </DataTable.Col>
      <DataTable.Col source="created_at" label="Created" />
      <DataTable.Col source="id" label="Actions">
        <RunScanButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
