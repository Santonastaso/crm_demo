import { List, CreateButton, DataTable, ReferenceField, TextField } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  disponibile: "default",
  opzionato: "secondary",
  compromesso: "outline",
  rogitato: "destructive",
};

const StatusBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Badge variant={STATUS_COLORS[record.status] ?? "outline"}>
      {record.status}
    </Badge>
  );
};

const PriceField = () => {
  const record = useRecordContext();
  if (!record?.current_price) return <span className="text-muted-foreground">—</span>;
  return (
    <span>
      €{Number(record.current_price).toLocaleString("it-IT")}
    </span>
  );
};

export const PropertyUnitList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "code", order: "ASC" }}
    actions={
      <TopToolbar>
        <CreateButton label="New Unit" />
      </TopToolbar>
    }
  >
    <DataTable rowClick="show">
      <DataTable.Col source="code" label="Code" />
      <DataTable.Col source="project_id" label="Project">
        <ReferenceField source="project_id" reference="projects" link="show">
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="typology" label="Typology" />
      <DataTable.Col source="floor" label="Floor" />
      <DataTable.Col source="square_meters" label="SQM" />
      <DataTable.Col source="rooms" label="Rooms" />
      <DataTable.Col source="energy_class" label="Energy" />
      <DataTable.Col source="current_price" label="Price">
        <PriceField />
      </DataTable.Col>
      <DataTable.Col source="status" label="Status">
        <StatusBadge />
      </DataTable.Col>
    </DataTable>
  </List>
);
