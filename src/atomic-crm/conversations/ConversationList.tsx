import {
  List,
  DataTable,
  ReferenceField,
  TextField,
} from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";

const StatusBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
    active: "default",
    escalated: "destructive",
    closed: "secondary",
  };
  return (
    <Badge variant={variants[record.status] ?? "outline"}>
      {record.status}
    </Badge>
  );
};

const ChannelBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <Badge variant="outline">{record.channel}</Badge>;
};

const ContactName = () => {
  const record = useRecordContext();
  if (!record?.contact_id) return <span className="text-muted-foreground">Anonymous</span>;
  return (
    <ReferenceField source="contact_id" reference="contacts" link="show">
      <TextField source="first_name" />
    </ReferenceField>
  );
};

export const ConversationList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "updated_at", order: "DESC" }}
    actions={<TopToolbar />}
  >
    <DataTable>
      <DataTable.Col source="contact_id" label="Contact">
        <ContactName />
      </DataTable.Col>
      <DataTable.Col source="channel" label="Channel">
        <ChannelBadge />
      </DataTable.Col>
      <DataTable.Col source="status" label="Status">
        <StatusBadge />
      </DataTable.Col>
      <DataTable.Col source="updated_at" label="Last Activity" />
    </DataTable>
  </List>
);
