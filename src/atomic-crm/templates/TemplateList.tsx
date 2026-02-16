import { List, CreateButton, DataTable } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";

const ChannelBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  const colors: Record<string, string> = {
    email: "default",
    whatsapp: "secondary",
    sms: "outline",
  };
  return (
    <Badge variant={(colors[record.channel] ?? "outline") as any}>
      {record.channel}
    </Badge>
  );
};

export const TemplateList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "name", order: "ASC" }}
    actions={
      <TopToolbar>
        <CreateButton label="New Template" />
      </TopToolbar>
    }
  >
    <DataTable>
      <DataTable.Col source="name" label="Name" />
      <DataTable.Col source="channel" label="Channel">
        <ChannelBadge />
      </DataTable.Col>
      <DataTable.Col source="subject" label="Subject" />
    </DataTable>
  </List>
);
