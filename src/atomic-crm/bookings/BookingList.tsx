import { List, DataTable, ReferenceField, TextField } from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext } from "ra-core";
import { Calendar, ExternalLink } from "lucide-react";
import type { Booking } from "../types";
import { StatusBadge } from "../misc/StatusBadge";

const ScheduledAt = () => {
  const record = useRecordContext<Booking>();
  if (!record?.scheduled_at) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-sm">
      {new Date(record.scheduled_at).toLocaleString()}
    </span>
  );
};

const CalcomLink = () => {
  const record = useRecordContext<Booking>();
  if (!record?.calcom_event_id) return null;
  return (
    <a
      href={`https://app.cal.com/bookings/${record.calcom_event_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="h-3 w-3" />
      Cal.com
    </a>
  );
};

export const BookingList = () => (
  <List
    title={false}
    perPage={25}
    sort={{ field: "scheduled_at", order: "DESC" }}
    actions={
      <TopToolbar>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Appointments
        </div>
      </TopToolbar>
    }
  >
    <DataTable>
      <DataTable.Col source="contact_id" label="Contact">
        <ReferenceField source="contact_id" reference="contacts" link="show">
          <TextField source="first_name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="scheduled_at" label="Scheduled">
        <ScheduledAt />
      </DataTable.Col>
      <DataTable.Col source="status" label="Status">
        <StatusBadge source="status" map={{ confirmed: "default", pending: "secondary", cancelled: "destructive", completed: "outline" }} />
      </DataTable.Col>
      <DataTable.Col source="sales_id" label="Agent">
        <ReferenceField source="sales_id" reference="sales" link={false}>
          <TextField source="first_name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="calcom_event_id" label="Link">
        <CalcomLink />
      </DataTable.Col>
    </DataTable>
  </List>
);
