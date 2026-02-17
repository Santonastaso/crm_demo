import {
  List,
  CreateButton,
  DataTable,
  ReferenceField,
  TextField,
} from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { StatusBadge, type StatusMap } from "@/atomic-crm/misc/StatusBadge";

const campaignStatusMap: StatusMap = {
  draft: "outline",
  scheduled: "secondary",
  sending: "default",
  completed: "default",
  paused: "destructive",
};

const SegmentName = () => {
  const record = useRecordContext();
  if (!record?.segment_id) return <span className="text-muted-foreground">-</span>;
  return (
    <ReferenceField source="segment_id" reference="segments" link={false}>
      <TextField source="name" />
    </ReferenceField>
  );
};

export const CampaignList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "created_at", order: "DESC" }}
    actions={
      <TopToolbar>
        <CreateButton label="New Campaign" />
      </TopToolbar>
    }
  >
    <DataTable>
      <DataTable.Col source="name" label="Campaign" />
      <DataTable.Col source="segment_id" label="Segment">
        <SegmentName />
      </DataTable.Col>
      <DataTable.Col source="channel" label="Channel">
        <StatusBadge source="channel" map={{}} />
      </DataTable.Col>
      <DataTable.Col source="status" label="Status">
        <StatusBadge source="status" map={campaignStatusMap} />
      </DataTable.Col>
      <DataTable.Col source="created_at" label="Created" />
    </DataTable>
  </List>
);
