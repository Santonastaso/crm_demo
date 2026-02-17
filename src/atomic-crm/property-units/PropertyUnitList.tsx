import { List, CreateButton, DataTable, ReferenceField, TextField } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { StatusBadge } from "@/atomic-crm/misc/StatusBadge";
import { UNIT_STATUS_COLORS } from "./unitStatus";
import { formatEUR } from "@/lib/formatPrice";

const PriceField = () => {
  const record = useRecordContext();
  if (!record?.current_price) return <span className="text-muted-foreground">—</span>;
  return (
    <span>
      {formatEUR(Number(record.current_price))}
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
        <StatusBadge source="status" map={UNIT_STATUS_COLORS} />
      </DataTable.Col>
    </DataTable>
  </List>
);
