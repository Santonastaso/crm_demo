import {
  List,
  DataTable,
  ReferenceField,
  TextField,
} from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { StatusBadge, type StatusMap } from "@/atomic-crm/misc/StatusBadge";

const conversationStatusMap: StatusMap = {
  active: "default",
  escalated: "destructive",
  closed: "secondary",
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
        <StatusBadge source="channel" map={{}} />
      </DataTable.Col>
      <DataTable.Col source="status" label="Status">
        <StatusBadge source="status" map={conversationStatusMap} />
      </DataTable.Col>
      <DataTable.Col source="updated_at" label="Last Activity" />
    </DataTable>
  </List>
);
